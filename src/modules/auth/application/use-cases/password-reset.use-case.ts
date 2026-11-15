import { UserRepository } from '../ports/user.repository';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { EmailServicePort } from '../ports/email.service.port';
import { VerificationCodePolicy } from './verification-code.policy';

/** failedSecret: a wrong code, which counts toward the limit per IP (Auth SPEC v0.6). */
type Result = { error: boolean; message: string; failedSecret?: boolean };

/** C4's only answer, whether or not an account uses the email (Auth SPEC v0.5, D6). */
export const RESET_REQUESTED_MESSAGE = 'If an account uses this email, a code was sent';
/** C5's only failure for the code, whatever the reason (wrong, expired, used up, unknown email: D6). */
export const RESET_INVALID_MESSAGE = 'Invalid or expired code';

const isValidEmail = (email: unknown): email is string =>
  typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

/**
 * C4 — a person asks for a reset code by email.
 * The answer never tells whether an account uses the email. A second request within a minute
 * sends nothing and gets the same answer: a 429 there would only happen for real accounts.
 */
export class RequestPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailServicePort,
    private readonly codes: VerificationCodePolicy = new VerificationCodePolicy(userRepository)
  ) {}

  async execute(email: unknown): Promise<Result> {
    try {
      if (!isValidEmail(email)) {
        return { error: true, message: 'Invalid email format' };
      }
      const user = await this.userRepository.findByEmail(email);
      if (user) {
        const issued = await this.codes.issue(email, 'reset');
        if (issued.sent) await this.emailService.sendPasswordResetEmail(email, issued.code);
      }
      return { error: false, message: RESET_REQUESTED_MESSAGE };
    } catch (error) {
      console.error('Error in RequestPasswordResetUseCase:', error);
      return { error: true, message: 'Internal server error' };
    }
  }
}

/**
 * C5 — a person sets a new password with the code.
 * It also clears the login lock and failure count, as the admin reset does (K7). Sessions open
 * elsewhere stay open until their token expires (D7, P8).
 */
export class ConfirmPasswordResetUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly codes: VerificationCodePolicy = new VerificationCodePolicy(userRepository)
  ) {}

  async execute(email: unknown, code: unknown, newPassword: unknown): Promise<Result> {
    try {
      if (typeof newPassword !== 'string' || newPassword.length < 6) {
        return { error: true, message: 'Password must be at least 6 characters' };
      }
      if (!isValidEmail(email)) {
        return { error: true, message: RESET_INVALID_MESSAGE };
      }
      const user = await this.userRepository.findByEmail(email);
      if (!user || (await this.codes.check(email, 'reset', code)) !== 'ok') {
        return { error: true, message: RESET_INVALID_MESSAGE, failedSecret: true };
      }
      const hashedPassword = await this.passwordHasher.hash(newPassword);
      await this.userRepository.updatePassword(user.id!, hashedPassword);
      await this.userRepository.resetLoginAttempts(user.id!);
      await this.userRepository.deleteVerificationCode(email, 'reset');
      return { error: false, message: 'Password changed' };
    } catch (error) {
      console.error('Error in ConfirmPasswordResetUseCase:', error);
      return { error: true, message: 'Internal server error' };
    }
  }
}
