import request from 'supertest';
import bcrypt from 'bcryptjs';
import { buildTestApp } from './helpers/build-test-app';
import { TEST_SECRET_KEY } from './helpers/jwt';
import { UserRepository } from '../../src/modules/auth/application/ports/user.repository';
import { UserRole } from '../../src/modules/auth/domain/entities/user.entity';

process.env.SECRET_KEY = TEST_SECRET_KEY;

jest.mock('../../src/modules/auth/infrastructure/persistence/user.mysql');
jest.mock('../../src/infrastructure/services/email');

import { userMysqlRepository } from '../../src/modules/auth/infrastructure/persistence/user.mysql';
import { buildAuthModule } from '../../src/modules/auth/infrastructure/config/auth.module';

const MockedUserRepository = userMysqlRepository as jest.MockedClass<typeof userMysqlRepository>;

const mockRepo: jest.Mocked<UserRepository> = {
  create: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  updatePassword: jest.fn(),
  updateLastLogin: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  saveVerificationCode: jest.fn(),
  findVerificationCode: jest.fn(),
  incrementVerificationAttempts: jest.fn(),
  deleteVerificationCode: jest.fn(),
};

MockedUserRepository.mockImplementation(() => mockRepo as any);

/**
 * Auth SPEC v0.6 through real HTTP: the app trusts one proxy hop, so X-Forwarded-For names the
 * client as the proxy in front of production does. Each test builds a fresh module, so its limiter
 * starts empty.
 */
describe('Auth limit per IP — integration (Auth SPEC v0.6)', () => {
  let app: ReturnType<typeof buildTestApp>;
  let passwordHash: string;

  beforeAll(async () => {
    passwordHash = await bcrypt.hash('RightPass123', 4);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    app = buildTestApp([{ path: '/api/users', router: buildAuthModule().router }]);
    // Every username exists, with no failures of its own, so only the IP limit can refuse
    mockRepo.findByEmailOrUsername.mockImplementation(async (_email, username) => ({
      id: 1,
      first_name: 'Sample',
      last_name: 'User',
      username,
      email: `${username}@example.com`,
      role: UserRole.USER,
      password: passwordHash,
      active: true,
      login_attempts: 0,
    }));
  });

  afterEach(() => jest.restoreAllMocks());

  const login = (ip: string, username: string, password: string) =>
    request(app).post('/api/users/login').set('X-Forwarded-For', ip).send({ username, password });

  it('F1: 20 wrong passwords over 5 accounts, then the right one for a 6th → 429', async () => {
    for (let i = 0; i < 20; i++) {
      const res = await login('203.0.113.7', `user${i % 5}`, 'wrong');
      expect(res.status).toBe(400);
    }
    const res = await login('203.0.113.7', 'user5', 'RightPass123');
    expect(res.status).toBe(429);
    expect(res.body).toEqual({ error: true, message: 'Too many attempts, try again later' });
    // The IP limit itself locks no account
    expect(mockRepo.lockUser).not.toHaveBeenCalled();
  });

  it('F3: 19 failures from one IP and 1 from another still get normal answers', async () => {
    for (let i = 0; i < 19; i++) await login('203.0.113.7', `user${i % 5}`, 'wrong');
    await login('198.51.100.2', 'user0', 'wrong');
    expect((await login('203.0.113.7', 'user9', 'RightPass123')).status).toBe(200);
    expect((await login('198.51.100.2', 'user9', 'RightPass123')).status).toBe(200);
  });

  it('F4: wrong passwords and wrong codes add up to the same 20', async () => {
    mockRepo.findByEmail.mockResolvedValue({ id: 1, email: 'sample@example.com' } as any);
    mockRepo.findByUsername.mockResolvedValue(null);
    mockRepo.findVerificationCode.mockResolvedValue({ id: 1, code: 123456, attempts: 0, ageSeconds: 10 });
    for (let i = 0; i < 10; i++) await login('203.0.113.7', `user${i % 5}`, 'wrong');
    for (let i = 0; i < 10; i++) {
      await request(app)
        .post('/api/users/password-reset/confirm')
        .set('X-Forwarded-For', '203.0.113.7')
        .send({ email: 'sample@example.com', code: 111111, newPassword: 'newSecret' });
    }
    const res = await request(app)
      .post('/api/users/password-reset/confirm')
      .set('X-Forwarded-For', '203.0.113.7')
      .send({ email: 'sample@example.com', code: 123456, newPassword: 'newSecret' });
    expect(res.status).toBe(429);
    expect(mockRepo.updatePassword).not.toHaveBeenCalled();
  });

  it('F5: a correct login does not reset the IP count', async () => {
    for (let i = 0; i < 10; i++) await login('203.0.113.7', `user${i % 5}`, 'wrong');
    expect((await login('203.0.113.7', 'user9', 'RightPass123')).status).toBe(200);
    for (let i = 0; i < 10; i++) await login('203.0.113.7', `user${i % 5}`, 'wrong');
    expect((await login('203.0.113.7', 'user9', 'RightPass123')).status).toBe(429);
  });

  it('takes the entry the proxy appended, not one the client wrote', async () => {
    for (let i = 0; i < 20; i++) await login(`10.0.0.${i}, 203.0.113.7`, `user${i % 5}`, 'wrong');
    expect((await login('192.0.2.99, 203.0.113.7', 'user9', 'RightPass123')).status).toBe(429);
  });

  it('never limits a request with no forwarded address (the loopback of the test client)', async () => {
    for (let i = 0; i < 25; i++) {
      await request(app).post('/api/users/login').send({ username: `user${i % 5}`, password: 'wrong' });
    }
    const res = await request(app).post('/api/users/login').send({ username: 'user9', password: 'RightPass123' });
    expect(res.status).toBe(200);
  });
});
