import {
  RequestPasswordResetUseCase,
  ConfirmPasswordResetUseCase,
  RESET_REQUESTED_MESSAGE,
  RESET_INVALID_MESSAGE,
} from '../../../../../src/modules/auth/application/use-cases/password-reset.use-case';
import { VerificationCodePolicy } from '../../../../../src/modules/auth/application/use-cases/verification-code.policy';
import { UserRepository } from '../../../../../src/modules/auth/application/ports/user.repository';
import { EmailServicePort } from '../../../../../src/modules/auth/application/ports/email.service.port';
import { PasswordHasherPort } from '../../../../../src/modules/auth/domain/ports/password-hasher.port';
import { UserRole } from '../../../../../src/modules/auth/domain/entities/user.entity';

const repo = {
  findByEmail: jest.fn(),
  findVerificationCode: jest.fn(),
  saveVerificationCode: jest.fn(),
  incrementVerificationAttempts: jest.fn(),
  deleteVerificationCode: jest.fn(),
  updatePassword: jest.fn(),
  resetLoginAttempts: jest.fn(),
} as unknown as jest.Mocked<UserRepository>;

const email = {
  sendVerificationCode: jest.fn(),
  sendWelcomeEmail: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
} as jest.Mocked<EmailServicePort>;

const hasher = { hash: jest.fn(), compare: jest.fn() } as jest.Mocked<PasswordHasherPort>;

const user = {
  id: 9,
  first_name: '',
  last_name: '',
  username: 'sample',
  email: 'sample@example.com',
  role: UserRole.USER,
  password: 'old-hash',
  active: true,
};

describe('RequestPasswordResetUseCase (C4)', () => {
  const useCase = new RequestPasswordResetUseCase(repo, email, new VerificationCodePolicy(repo, () => 0.25));

  beforeEach(() => jest.resetAllMocks());

  it('emails a reset code to an account and gives the one answer (E6)', async () => {
    repo.findByEmail.mockResolvedValue(user);
    repo.findVerificationCode.mockResolvedValue(null);

    expect(await useCase.execute('sample@example.com')).toEqual({ error: false, message: RESET_REQUESTED_MESSAGE });
    expect(repo.saveVerificationCode).toHaveBeenCalledWith('sample@example.com', 325000, 'reset');
    expect(email.sendPasswordResetEmail).toHaveBeenCalledWith('sample@example.com', 325000);
  });

  it('gives the same answer for an email with no account, and stores and sends nothing (E5)', async () => {
    repo.findByEmail.mockResolvedValue(null);

    expect(await useCase.execute('nobody@example.com')).toEqual({ error: false, message: RESET_REQUESTED_MESSAGE });
    expect(repo.saveVerificationCode).not.toHaveBeenCalled();
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('gives the same answer within a minute of the last code, and sends nothing (D6)', async () => {
    repo.findByEmail.mockResolvedValue(user);
    repo.findVerificationCode.mockResolvedValue({ id: 1, code: 1, attempts: 0, ageSeconds: 5 });

    expect(await useCase.execute('sample@example.com')).toEqual({ error: false, message: RESET_REQUESTED_MESSAGE });
    expect(email.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('refuses a missing or malformed email', async () => {
    expect(await useCase.execute(undefined)).toEqual({ error: true, message: 'Invalid email format' });
    expect(await useCase.execute('not-an-email')).toEqual({ error: true, message: 'Invalid email format' });
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it('answers an internal error when something fails', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation();
    repo.findByEmail.mockRejectedValue(new Error('db down'));
    expect(await useCase.execute('sample@example.com')).toEqual({ error: true, message: 'Internal server error' });
    error.mockRestore();
  });

  it('builds its own code policy when none is given', async () => {
    const plain = new RequestPasswordResetUseCase(repo, email);
    repo.findByEmail.mockResolvedValue(null);
    expect((await plain.execute('nobody@example.com')).error).toBe(false);
  });
});

describe('ConfirmPasswordResetUseCase (C5)', () => {
  const useCase = new ConfirmPasswordResetUseCase(repo, hasher, new VerificationCodePolicy(repo));

  beforeEach(() => jest.resetAllMocks());

  it('changes the password, clears the login lock and deletes the code (E6, E7)', async () => {
    repo.findByEmail.mockResolvedValue(user);
    repo.findVerificationCode.mockResolvedValue({ id: 4, code: 123456, attempts: 0, ageSeconds: 30 });
    hasher.hash.mockResolvedValue('new-hash');

    expect(await useCase.execute('sample@example.com', '123456', 'newSecret')).toEqual({
      error: false,
      message: 'Password changed',
    });
    expect(hasher.hash).toHaveBeenCalledWith('newSecret');
    expect(repo.updatePassword).toHaveBeenCalledWith(9, 'new-hash');
    expect(repo.resetLoginAttempts).toHaveBeenCalledWith(9);
    expect(repo.deleteVerificationCode).toHaveBeenCalledWith('sample@example.com', 'reset');
  });

  it('gives one message for a wrong code, an expired one, or an unknown email (D6)', async () => {
    repo.findByEmail.mockResolvedValue(user);
    repo.findVerificationCode.mockResolvedValue({ id: 4, code: 123456, attempts: 0, ageSeconds: 30 });
    // A wrong code, and an unknown email, count toward the limit per IP (Auth SPEC v0.6)
    expect(await useCase.execute('sample@example.com', 111111, 'newSecret')).toEqual({
      error: true,
      message: RESET_INVALID_MESSAGE,
      failedSecret: true,
    });

    repo.findVerificationCode.mockResolvedValue({ id: 4, code: 123456, attempts: 0, ageSeconds: 901 });
    expect((await useCase.execute('sample@example.com', 123456, 'newSecret')).message).toBe(RESET_INVALID_MESSAGE);

    repo.findByEmail.mockResolvedValue(null);
    expect((await useCase.execute('nobody@example.com', 123456, 'newSecret')).message).toBe(RESET_INVALID_MESSAGE);
    expect(await useCase.execute('not-an-email', 123456, 'newSecret')).toEqual({
      error: true,
      message: RESET_INVALID_MESSAGE,
    });
    expect(repo.updatePassword).not.toHaveBeenCalled();
  });

  it('refuses a password under 6 characters, or none, before looking anything up', async () => {
    expect(await useCase.execute('sample@example.com', 123456, '12345')).toEqual({
      error: true,
      message: 'Password must be at least 6 characters',
    });
    expect((await useCase.execute('sample@example.com', 123456, undefined)).error).toBe(true);
    expect(repo.findByEmail).not.toHaveBeenCalled();
  });

  it('answers an internal error when something fails', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation();
    repo.findByEmail.mockRejectedValue(new Error('db down'));
    expect(await useCase.execute('sample@example.com', 123456, 'newSecret')).toEqual({
      error: true,
      message: 'Internal server error',
    });
    error.mockRestore();
  });

  it('builds its own code policy when none is given', async () => {
    const plain = new ConfirmPasswordResetUseCase(repo, hasher);
    repo.findByEmail.mockResolvedValue(null);
    expect((await plain.execute('nobody@example.com', 1, 'newSecret')).message).toBe(RESET_INVALID_MESSAGE);
  });
});
