import request from 'supertest';
import bcrypt from 'bcryptjs';
import { buildTestApp } from './helpers/build-test-app';
import { TEST_SECRET_KEY, signAdminToken, signToken, bearer } from './helpers/jwt';
import { UserRepository } from '../../src/modules/auth/application/ports/user.repository';
import { UserRole } from '../../src/modules/auth/domain/entities/user.entity';

process.env.SECRET_KEY = TEST_SECRET_KEY;

jest.mock('../../src/modules/auth/infrastructure/persistence/user.mysql');
// Real SmtpEmailService calls this — mock it so tests never attempt a real SMTP connection.
jest.mock('../../src/infrastructure/services/email');

import { userMysqlRepository } from '../../src/modules/auth/infrastructure/persistence/user.mysql';
import sendEmail from '../../src/infrastructure/services/email';
import { buildAuthModule } from '../../src/modules/auth/infrastructure/config/auth.module';

const MockedUserRepository = userMysqlRepository as jest.MockedClass<typeof userMysqlRepository>;
const mockSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;

const mockRepo: jest.Mocked<UserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updatePassword: jest.fn(),
  updateLastLogin: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  unlockUser: jest.fn(),
  saveVerificationCode: jest.fn(),
  validateVerificationCode: jest.fn(),
  deleteVerificationCode: jest.fn(),
};

MockedUserRepository.mockImplementation(() => mockRepo as any);

const app = buildTestApp([{ path: '/api/users', router: buildAuthModule().router }]);

const validRegistration = {
  first_name: 'Test',
  last_name: 'User',
  username: 'testuser',
  email: 'test@example.com',
  password: 'SecurePass123',
};

describe('Auth module — integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendEmail.mockResolvedValue(undefined as any);
  });

  describe('POST /add (register)', () => {
    it('sends a verification code for a valid new registration and does not create the user yet', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.saveVerificationCode.mockResolvedValue(undefined);

      const res = await request(app).post('/api/users/add').send(validRegistration);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Verification code sent');
      expect(mockSendEmail).toHaveBeenCalledWith('test@example.com', expect.any(String), expect.any(String));
      expect(mockRepo.create).not.toHaveBeenCalled();
    });

    it('creates the user once a valid verification code is provided', async () => {
      mockRepo.findByEmail.mockResolvedValue(null);
      mockRepo.findByUsername.mockResolvedValue(null);
      mockRepo.validateVerificationCode.mockResolvedValue(true);
      mockRepo.create.mockResolvedValue({
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        password: 'hashed',
        active: true,
        created: '2026-07-14 00:00:00',
      });
      mockRepo.deleteVerificationCode.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/users/add')
        .send({ ...validRegistration, verificationCode: 123456 });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User created successfully');
      expect(res.body.data.username).toBe('testuser');
      // Password must never leak into the API response.
      expect(res.body.data.password).toBeUndefined();
      expect(mockRepo.create).toHaveBeenCalled();
    });

    it('returns 400 for an invalid email format without touching the repository', async () => {
      const res = await request(app)
        .post('/api/users/add')
        .send({ ...validRegistration, email: 'not-an-email' });

      expect(res.status).toBe(400);
      expect(mockRepo.findByEmail).not.toHaveBeenCalled();
    });

    it('returns 400 when the email is already registered', async () => {
      mockRepo.findByEmail.mockResolvedValue({
        id: 2,
        first_name: 'Existing',
        last_name: 'User',
        username: 'existinguser',
        email: 'test@example.com',
        role: UserRole.USER,
        password: 'hashed',
        active: true,
      } as any);
      mockRepo.findByUsername.mockResolvedValue(null);

      const res = await request(app).post('/api/users/add').send(validRegistration);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Email already exists');
    });
  });

  describe('POST /login', () => {
    it('logs in successfully with correct credentials and returns a usable JWT', async () => {
      const passwordHash = await bcrypt.hash('SecurePass123', 10);
      mockRepo.findByEmailOrUsername.mockResolvedValue({
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        password: passwordHash,
        active: true,
        login_attempts: 0,
        created: '2026-07-14 00:00:00',
      });
      mockRepo.resetLoginAttempts.mockResolvedValue(undefined);
      mockRepo.updateLastLogin.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'testuser', password: 'SecurePass123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toEqual(expect.any(String));
      expect(res.body.data.user.username).toBe('testuser');
      expect(res.body.data.user.password).toBeUndefined();
    });

    it('returns 400 and increments failed attempts for a wrong password', async () => {
      const passwordHash = await bcrypt.hash('SecurePass123', 10);
      mockRepo.findByEmailOrUsername.mockResolvedValue({
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        password: passwordHash,
        active: true,
        login_attempts: 0,
      } as any);
      mockRepo.incrementLoginAttempts.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'testuser', password: 'WrongPassword' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
      expect(mockRepo.incrementLoginAttempts).toHaveBeenCalledWith(1);
    });

    it('returns 400 when the user does not exist', async () => {
      mockRepo.findByEmailOrUsername.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'ghost', password: 'whatever123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid credentials');
    });

    it('returns 400 for an inactive account', async () => {
      mockRepo.findByEmailOrUsername.mockResolvedValue({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: UserRole.USER,
        password: 'irrelevant',
        active: false,
      } as any);

      const res = await request(app)
        .post('/api/users/login')
        .send({ username: 'testuser', password: 'anything123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Account is inactive');
    });
  });

  describe('PUT /admin/reset-password', () => {
    it('requires a token', async () => {
      const res = await request(app)
        .put('/api/users/admin/reset-password')
        .send({ identifier: 'testuser', newPassword: 'newSecurePassword123' });

      expect(res.status).toBe(401);
    });

    it('requires an admin token — a regular user token is rejected', async () => {
      const res = await request(app)
        .put('/api/users/admin/reset-password')
        .set('Authorization', bearer(signToken({ role: 2 })))
        .send({ identifier: 'testuser', newPassword: 'newSecurePassword123' });

      expect(res.status).toBe(403);
      expect(mockRepo.updatePassword).not.toHaveBeenCalled();
    });

    it('resets the target user\'s password with a valid admin token', async () => {
      mockRepo.findByEmailOrUsername.mockResolvedValue({
        id: 5,
        username: 'targetuser',
        email: 'target@example.com',
        role: UserRole.USER,
        password: 'oldhash',
        active: true,
      } as any);
      mockRepo.updatePassword.mockResolvedValue(undefined);
      mockRepo.resetLoginAttempts.mockResolvedValue(undefined);

      const res = await request(app)
        .put('/api/users/admin/reset-password')
        .set('Authorization', bearer(signAdminToken()))
        .send({ identifier: 'targetuser', newPassword: 'newSecurePassword123' });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Password reset successfully');
      expect(mockRepo.findByEmailOrUsername).toHaveBeenCalledWith('targetuser', 'targetuser');
      expect(mockRepo.updatePassword).toHaveBeenCalledWith(5, expect.any(String));
      expect(mockRepo.resetLoginAttempts).toHaveBeenCalledWith(5);
    });

    it('returns 400 when the target user does not exist', async () => {
      mockRepo.findByEmailOrUsername.mockResolvedValue(null);

      const res = await request(app)
        .put('/api/users/admin/reset-password')
        .set('Authorization', bearer(signAdminToken()))
        .send({ identifier: 'ghost', newPassword: 'newSecurePassword123' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('User not found');
    });

    it('returns 400 for a new password shorter than 6 characters', async () => {
      const res = await request(app)
        .put('/api/users/admin/reset-password')
        .set('Authorization', bearer(signAdminToken()))
        .send({ identifier: 'targetuser', newPassword: '123' });

      expect(res.status).toBe(400);
      expect(mockRepo.findByEmailOrUsername).not.toHaveBeenCalled();
    });
  });
});
