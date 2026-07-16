import { UserRepository } from '../ports/user.repository';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

/**
 * Use case for an administrator resetting another user's password.
 * Does not require the current password - authorization is entirely the
 * caller's responsibility (gated by validateAdmin at the route level, see
 * auth.module.ts).
 */
export class AdminResetPasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort
  ) {}

  async execute(identifier: string, newPassword: string): Promise<{ error: boolean; message: string }> {
    try {
      if (!identifier || !identifier.trim()) {
        return { error: true, message: 'Username or email is required' };
      }

      if (!newPassword || newPassword.length < 6) {
        return { error: true, message: 'Password must be at least 6 characters' };
      }

      const user = await this.userRepository.findByEmailOrUsername(identifier, identifier);
      if (!user) {
        return { error: true, message: 'User not found' };
      }

      const hashedPassword = await this.passwordHasher.hash(newPassword);
      await this.userRepository.updatePassword(user.id!, hashedPassword);

      // Also clear any lockout, so the reset password can be used right
      // away - matches the intent of an admin fixing an account.
      await this.userRepository.resetLoginAttempts(user.id!);

      return { error: false, message: 'Password reset successfully' };
    } catch (error) {
      console.error('Error in AdminResetPasswordUseCase:', error);
      return { error: true, message: 'Internal server error' };
    }
  }
}
