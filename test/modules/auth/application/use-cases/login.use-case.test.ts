import { LoginUserUseCase } from '../../../../../src/modules/auth/application/use-cases/login.use-case';
import { UserRepository } from '../../../../../src/modules/auth/application/ports/user.repository';
import { PasswordHasherPort } from '../../../../../src/modules/auth/domain/ports/password-hasher.port';
import { TokenGeneratorPort } from '../../../../../src/modules/auth/domain/ports/token-generator.port';
import Login from '../../../../../src/modules/auth/domain/entities/login.entity';
import { UserRole } from '../../../../../src/modules/auth/domain/entities/user.entity';

// Mock dependencies
const mockUserRepository: jest.Mocked<UserRepository> = {
  findByEmail: jest.fn(),
  findByUsername: jest.fn(),
  create: jest.fn(),
  findByEmailOrUsername: jest.fn(),
  saveVerificationCode: jest.fn(),
  validateVerificationCode: jest.fn(),
  deleteVerificationCode: jest.fn(),
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
  lockUser: jest.fn(),
  updateLastLogin: jest.fn(),
};

const mockPasswordHasher: jest.Mocked<PasswordHasherPort> = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockTokenGenerator: jest.Mocked<TokenGeneratorPort> = {
  generate: jest.fn(),
};

describe('LoginUserUseCase', () => {
  let loginUserUseCase: LoginUserUseCase;

  beforeEach(() => {
    loginUserUseCase = new LoginUserUseCase(mockUserRepository, mockPasswordHasher, mockTokenGenerator);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const mockUser = {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      password: 'hashedpassword',
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.USER,
      active: true,
      created: '2023-01-01 00:00:00',
      modified: '2023-01-01 00:00:00',
      login_attempts: 0,
      locked_until: null,
      last_login: null,
    };

    it('should login user successfully with username', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'password123',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockUserRepository.resetLoginAttempts.mockResolvedValue();
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockTokenGenerator.generate.mockReturnValue('jwt-token');

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(false);
      expect(result.token).toBe('jwt-token');
      expect(result.data).toBeDefined();
      expect(result.data?.user.username).toBe('testuser');
      expect(result.data?.token).toBe('jwt-token');
      expect(result.data?.expiresIn).toBe(86400);
      expect(mockUserRepository.findByEmailOrUsername).toHaveBeenCalledWith('', 'testuser');
      expect(mockPasswordHasher.compare).toHaveBeenCalledWith('password123', 'hashedpassword');
      expect(mockUserRepository.resetLoginAttempts).toHaveBeenCalledWith(1);
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(1);
      expect(mockTokenGenerator.generate).toHaveBeenCalledWith({
        userId: 1,
        username: 'testuser',
        role: UserRole.USER,
      });
    });

    it('should login user successfully with email', async () => {
      const loginData: Login = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockUserRepository.resetLoginAttempts.mockResolvedValue();
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockTokenGenerator.generate.mockReturnValue('jwt-token');

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(false);
      expect(result.token).toBe('jwt-token');
      expect(mockUserRepository.findByEmailOrUsername).toHaveBeenCalledWith('test@example.com', '');
    });

    it('should return error when no identifier provided', async () => {
      const loginData: Login = {
        password: 'password123',
      };

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Username or email is required');
    });

    it('should return error when user not found', async () => {
      const loginData: Login = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid credentials');
    });

    it('should return error when account is inactive', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'password123',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue({
        ...mockUser,
        active: false,
      });

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Account is inactive');
    });

    it('should return error when account is locked', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'password123',
      };

      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + 15);

      mockUserRepository.findByEmailOrUsername.mockResolvedValue({
        ...mockUser,
        locked_until: lockUntil.toISOString(),
      });

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Account is temporarily locked');
    });

    it('should return error for wrong password', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
      mockPasswordHasher.compare.mockResolvedValue(false);
      mockUserRepository.incrementLoginAttempts.mockResolvedValue();

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid credentials');
      expect(mockUserRepository.incrementLoginAttempts).toHaveBeenCalledWith(1);
    });

    it('should lock account after 5 failed attempts', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue({
        ...mockUser,
        login_attempts: 4,
      });
      mockPasswordHasher.compare.mockResolvedValue(false);
      mockUserRepository.incrementLoginAttempts.mockResolvedValue();
      mockUserRepository.lockUser.mockResolvedValue();

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Too many failed attempts. Account locked for 15 minutes');
      expect(mockUserRepository.lockUser).toHaveBeenCalledWith(1, expect.any(Date));
    });

    it('should handle internal server error', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'password123',
      };

      mockUserRepository.findByEmailOrUsername.mockRejectedValue(new Error('Database error'));

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Internal server error');
    });

    it('should reset login attempts on successful login', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'password123',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue({
        ...mockUser,
        login_attempts: 3, // User had previous failed attempts
      });
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockUserRepository.resetLoginAttempts.mockResolvedValue();
      mockUserRepository.updateLastLogin.mockResolvedValue();
      mockTokenGenerator.generate.mockReturnValue('jwt-token');

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(false);
      expect(mockUserRepository.resetLoginAttempts).toHaveBeenCalledWith(1);
      expect(mockUserRepository.updateLastLogin).toHaveBeenCalledWith(1);
    });

    it('should handle edge case with null login_attempts', async () => {
      const loginData: Login = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      mockUserRepository.findByEmailOrUsername.mockResolvedValue({
        ...mockUser,
        login_attempts: null,
      });
      mockPasswordHasher.compare.mockResolvedValue(false);
      mockUserRepository.incrementLoginAttempts.mockResolvedValue();

      const result = await loginUserUseCase.execute(loginData);

      expect(result.error).toBe(true);
      expect(result.message).toBe('Invalid credentials');
      expect(mockUserRepository.incrementLoginAttempts).toHaveBeenCalledWith(1);
    });
  });
});
