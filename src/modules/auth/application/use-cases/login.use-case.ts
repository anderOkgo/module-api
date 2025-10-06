import Login from '../../domain/entities/login.entity';
import { LoginResponse, UserResponse } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenGeneratorPort } from '../../domain/ports/token-generator.port';

/**
 * Use case for user login
 * Implements all authentication logic
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly tokenGenerator: TokenGeneratorPort
  ) {}

  async execute(
    loginData: Login
  ): Promise<{ error: boolean; message?: string; token?: string; data?: LoginResponse }> {
    try {
      // 1. Validate that username or email is provided
      const loginIdentifier = loginData.email ?? loginData.username;
      if (!loginIdentifier) {
        return { error: true, message: 'Username or email is required' };
      }

      // 2. Search user by email or username
      const user = await this.userRepository.findByEmailOrUsername(
        loginData.email ?? '',
        loginData.username ?? ''
      );

      if (!user) {
        return { error: true, message: 'Invalid credentials' };
      }

      // 3. Check if account is active
      if (!user.active) {
        return { error: true, message: 'Account is inactive' };
      }

      // 4. Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { error: true, message: 'Account is temporarily locked' };
      }

      // 5. Compare password
      const isValidPassword = await this.passwordHasher.compare(loginData.password, user.password);

      if (!isValidPassword) {
        // Increment failed attempts
        await this.userRepository.incrementLoginAttempts(user.id!);

        // Lock account if there are many attempts
        if ((user.login_attempts ?? 0) >= 4) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Lock for 15 minutes
          await this.userRepository.lockUser(user.id!, lockUntil);
          return { error: true, message: 'Too many failed attempts. Account locked for 15 minutes' };
        }

        return { error: true, message: 'Invalid credentials' };
      }

      // 6. Reset login attempts and update last_login
      await this.userRepository.resetLoginAttempts(user.id!);
      await this.userRepository.updateLastLogin(user.id!);

      // 7. Generate JWT token
      const token = this.tokenGenerator.generate({
        userId: user.id!,
        username: user.username,
        role: user.role,
      });

      // 8. Map user response
      const userResponse: UserResponse = {
        id: user.id!,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        created: user.created!,
        last_login: user.last_login,
      };

      const loginResponse: LoginResponse = {
        user: userResponse,
        token,
        expiresIn: 86400, // 24 hours in seconds
      };

      return {
        error: false,
        token, // Maintain compatibility with previous format
        data: loginResponse,
      };
    } catch (error) {
      console.error('Error in LoginUserUseCase:', error);
      return { error: true, message: 'Internal server error' };
    }
  }
}
