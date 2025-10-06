import { RegisterUserUseCase } from '../../../../../src/modules/auth/application/use-cases/register.use-case';
import { UserRepository } from '../../../../../src/modules/auth/application/ports/user.repository';
import { PasswordHasherPort } from '../../../../../src/modules/auth/domain/ports/password-hasher.port';
import { EmailServicePort } from '../../../../../src/modules/auth/application/ports/email.service.port';
import { UserCreateRequest, UserRole } from '../../../../../src/modules/auth/domain/entities/user.entity';

// Mock dependencies
const mockUserRepository: jest.Mocked<UserRepository> = {
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  saveVerificationCode: jest.fn(),
  validateVerificationCode: jest.fn(),
  deleteVerificationCode: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  unlockUser: jest.fn(),
  updateLastLogin: jest.fn(),
  updatePassword: jest.fn(),
};

const mockPasswordHasher: jest.Mocked<PasswordHasherPort> = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockEmailService: jest.Mocked<EmailServicePort> = {
  sendVerificationCode: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
};

describe('RegisterUserUseCase', () => {
  let registerUserUseCase: RegisterUserUseCase;

  beforeEach(() => {
    registerUserUseCase = new RegisterUserUseCase(mockUserRepository, mockPasswordHasher, mockEmailService);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validUserData: UserCreateRequest = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    };

    it('should register user successfully', async () => {
      // Mock no existing user
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.validateVerificationCode.mockResolvedValue(true);
      mockPasswordHasher.hash.mockResolvedValue('hashedpassword');
      mockUserRepository.create.mockResolvedValue({
        id: 1,
        ...validUserData,
        role: UserRole.USER,
        password: 'hashedpassword',
        active: true,
        created: '2023-01-01 00:00:00',
        modified: '2023-01-01 00:00:00',
      });
      mockUserRepository.deleteVerificationCode.mockResolvedValue();

      const result = await registerUserUseCase.execute({
        ...validUserData,
        verificationCode: 123456,
      });

      expect(result.error).toBe(false);
      expect(result.message).toBe('User created successfully');
      expect(result.data).toBeDefined();
      expect(result.data?.username).toBe('testuser');
      expect(mockPasswordHasher.hash).toHaveBeenCalledWith('password123');
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.deleteVerificationCode).toHaveBeenCalledWith('test@example.com');
    });

    it('should send verification code when not provided', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.saveVerificationCode.mockResolvedValue();
      mockEmailService.sendVerificationCode.mockResolvedValue();

      const result = await registerUserUseCase.execute(validUserData);

      expect(result.error).toBe(false);
      expect(result.message).toBe('Verification code sent');
      expect(mockUserRepository.saveVerificationCode).toHaveBeenCalledWith('test@example.com', expect.any(Number));
      expect(mockEmailService.sendVerificationCode).toHaveBeenCalledWith('test@example.com', expect.any(Number));
    });

    it('should return error for invalid email format', async () => {
      const result = await registerUserUseCase.execute({
        ...validUserData,
        email: 'invalid-email',
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain('Invalid email format');
    });

    it('should return error for invalid username format', async () => {
      const result = await registerUserUseCase.execute({
        ...validUserData,
        username: 'ab', // Too short
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain('Invalid username format');
    });

    it('should return error for short password', async () => {
      const result = await registerUserUseCase.execute({
        ...validUserData,
        password: '123', // Too short
      });

      expect(result.error).toBe(true);
      expect(result.message).toContain('Password must be at least 6 characters');
    });

    it('should return error when email already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'existinguser',
        password: 'hashed',
        first_name: 'Existing',
        last_name: 'User',
        role: UserRole.USER,
        active: true,
        created: '2023-01-01 00:00:00',
        modified: '2023-01-01 00:00:00',
      });

      const result = await registerUserUseCase.execute(validUserData);

      expect(result.error).toBe(true);
      expect(result.message).toContain('Email already exists');
    });

    it('should return error when username already exists', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue({
        id: 1,
        email: 'existing@example.com',
        username: 'testuser',
        password: 'hashed',
        first_name: 'Existing',
        last_name: 'User',
        role: UserRole.USER,
        active: true,
        created: '2023-01-01 00:00:00',
        modified: '2023-01-01 00:00:00',
      });

      const result = await registerUserUseCase.execute(validUserData);

      expect(result.error).toBe(true);
      expect(result.message).toContain('User already exists');
    });

    it('should return error for invalid verification code', async () => {
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.findByUsername.mockResolvedValue(null);
      mockUserRepository.validateVerificationCode.mockResolvedValue(false);

      const result = await registerUserUseCase.execute({
        ...validUserData,
        verificationCode: 123456,
      });

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid verification code');
    });

    it('should handle internal server error', async () => {
      mockUserRepository.findByEmail.mockRejectedValue(new Error('Database error'));

      const result = await registerUserUseCase.execute(validUserData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Internal server error');
    });
  });

  describe('validation methods', () => {
    const baseUserData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
    };

    it('should validate email format correctly', async () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@gmail.com'];
      const invalidEmails = ['invalid-email', '@example.com', 'test@', 'test.example.com'];

      for (const email of validEmails) {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.saveVerificationCode.mockResolvedValue();
        mockEmailService.sendVerificationCode.mockResolvedValue();

        const result = await registerUserUseCase.execute({
          ...baseUserData,
          email,
        });
        // Should not fail on email validation (might fail on other validations)
        expect(result.message).not.toContain('Invalid email format');
      }

      for (const email of invalidEmails) {
        const result = await registerUserUseCase.execute({
          ...baseUserData,
          email,
        });
        expect(result.message).toContain('Invalid email format');
      }
    });

    it('should validate username format correctly', async () => {
      const validUsernames = ['testuser', 'user123', 'test_user', 'a'.repeat(20)];
      const invalidUsernames = ['ab', 'a'.repeat(21), 'test-user', 'test@user', 'test user'];

      for (const username of validUsernames) {
        mockUserRepository.findByEmail.mockResolvedValue(null);
        mockUserRepository.findByUsername.mockResolvedValue(null);
        mockUserRepository.saveVerificationCode.mockResolvedValue();
        mockEmailService.sendVerificationCode.mockResolvedValue();

        const result = await registerUserUseCase.execute({
          ...baseUserData,
          username,
        });
        expect(result.message).not.toContain('Invalid username format');
      }

      for (const username of invalidUsernames) {
        const result = await registerUserUseCase.execute({
          ...baseUserData,
          username,
        });
        expect(result.message).toContain('Invalid username format');
      }
    });
  });
});
