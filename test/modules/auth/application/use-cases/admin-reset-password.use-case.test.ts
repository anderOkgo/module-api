import { AdminResetPasswordUseCase } from '../../../../../src/modules/auth/application/use-cases/admin-reset-password.use-case';
import { UserRepository } from '../../../../../src/modules/auth/application/ports/user.repository';
import { PasswordHasherPort } from '../../../../../src/modules/auth/domain/ports/password-hasher.port';
import { UserRole } from '../../../../../src/modules/auth/domain/entities/user.entity';

const mockUserRepository: jest.Mocked<UserRepository> = {
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

const mockPasswordHasher: jest.Mocked<PasswordHasherPort> = {
  hash: jest.fn(),
  compare: jest.fn(),
};

describe('AdminResetPasswordUseCase', () => {
  let useCase: AdminResetPasswordUseCase;

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    password: 'oldhash',
    first_name: 'Test',
    last_name: 'User',
    role: UserRole.USER,
    active: true,
    created: '2023-01-01 00:00:00',
    modified: '2023-01-01 00:00:00',
  };

  beforeEach(() => {
    useCase = new AdminResetPasswordUseCase(mockUserRepository, mockPasswordHasher);
    jest.clearAllMocks();
  });

  it('resets the password for a user found by username', async () => {
    mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
    mockPasswordHasher.hash.mockResolvedValue('newhash');
    mockUserRepository.updatePassword.mockResolvedValue();
    mockUserRepository.resetLoginAttempts.mockResolvedValue();

    const result = await useCase.execute('testuser', 'newSecurePassword123');

    expect(result).toEqual({ error: false, message: 'Password reset successfully' });
    expect(mockUserRepository.findByEmailOrUsername).toHaveBeenCalledWith('testuser', 'testuser');
    expect(mockPasswordHasher.hash).toHaveBeenCalledWith('newSecurePassword123');
    expect(mockUserRepository.updatePassword).toHaveBeenCalledWith(1, 'newhash');
    expect(mockUserRepository.resetLoginAttempts).toHaveBeenCalledWith(1);
  });

  it('resets the password for a user found by email', async () => {
    mockUserRepository.findByEmailOrUsername.mockResolvedValue(mockUser);
    mockPasswordHasher.hash.mockResolvedValue('newhash');
    mockUserRepository.updatePassword.mockResolvedValue();
    mockUserRepository.resetLoginAttempts.mockResolvedValue();

    const result = await useCase.execute('test@example.com', 'newSecurePassword123');

    expect(result.error).toBe(false);
    expect(mockUserRepository.findByEmailOrUsername).toHaveBeenCalledWith('test@example.com', 'test@example.com');
  });

  it('returns an error when the identifier is missing', async () => {
    const result = await useCase.execute('', 'newSecurePassword123');

    expect(result).toEqual({ error: true, message: 'Username or email is required' });
    expect(mockUserRepository.findByEmailOrUsername).not.toHaveBeenCalled();
  });

  it('returns an error when the identifier is only whitespace', async () => {
    const result = await useCase.execute('   ', 'newSecurePassword123');

    expect(result).toEqual({ error: true, message: 'Username or email is required' });
  });

  it('returns an error when the new password is missing', async () => {
    const result = await useCase.execute('testuser', '');

    expect(result).toEqual({ error: true, message: 'Password must be at least 6 characters' });
    expect(mockUserRepository.findByEmailOrUsername).not.toHaveBeenCalled();
  });

  it('returns an error when the new password is too short', async () => {
    const result = await useCase.execute('testuser', '12345');

    expect(result).toEqual({ error: true, message: 'Password must be at least 6 characters' });
  });

  it('returns an error when the user is not found', async () => {
    mockUserRepository.findByEmailOrUsername.mockResolvedValue(null);

    const result = await useCase.execute('nosuchuser', 'newSecurePassword123');

    expect(result).toEqual({ error: true, message: 'User not found' });
    expect(mockPasswordHasher.hash).not.toHaveBeenCalled();
  });

  it('returns a generic error when the repository throws', async () => {
    mockUserRepository.findByEmailOrUsername.mockRejectedValue(new Error('DB down'));

    const result = await useCase.execute('testuser', 'newSecurePassword123');

    expect(result).toEqual({ error: true, message: 'Internal server error' });
  });
});
