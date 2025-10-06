import User, { UserCreateRequest, UserResponse, UserRole } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { EmailServicePort } from '../ports/email.service.port';

/**
 * Use case for user registration
 * Implements all business logic for registration
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasherPort,
    private readonly emailService: EmailServicePort
  ) {}

  async execute(userData: UserCreateRequest): Promise<{ error: boolean; message?: string; data?: UserResponse }> {
    try {
      const errors: string[] = [];

      // 1. Validate email format
      if (!this.isValidEmail(userData.email)) {
        errors.push('Invalid email format');
      }

      // 2. Validate username format
      if (!this.isValidUsername(userData.username)) {
        errors.push('Invalid username format');
      }

      // 3. Validate password length
      if (!userData.password || userData.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }

      if (errors.length > 0) {
        return { error: true, message: errors.join(', ') };
      }

      // 4. Check that email does not exist
      const existingEmail = await this.userRepository.findByEmail(userData.email);
      if (existingEmail) {
        errors.push('Email already exists');
      }

      // 5. Check that username does not exist
      const existingUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUsername) {
        errors.push('User already exists');
      }

      if (errors.length > 0) {
        return { error: true, message: errors.join(', ') };
      }

      // 6. If no verification code, generate and send
      if (!userData.verificationCode) {
        const verificationCode = this.generateVerificationCode();
        await this.saveVerificationCode(userData.email, verificationCode);
        await this.emailService.sendVerificationCode(userData.email, verificationCode);
        return { error: false, message: 'Verification code sent' };
      }

      // 7. Validate verification code
      const isValidCode = await this.validateVerificationCode(userData.email, userData.verificationCode);
      if (!isValidCode) {
        return { error: true, message: 'Invalid verification code' };
      }

      // 8. Hash password
      const hashedPassword = await this.passwordHasher.hash(userData.password);

      // 9. Create user
      const newUser: Partial<User> = {
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        username: userData.username,
        email: userData.email,
        role: UserRole.USER,
        password: hashedPassword,
        active: true,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      const user = await this.userRepository.create(newUser as User);

      // 10. Delete used verification code
      await this.deleteVerificationCode(userData.email);

      // 11. Map response
      const response: UserResponse = {
        id: user.id!,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        created: user.created!,
      };

      return { error: false, message: 'User created successfully', data: response };
    } catch (error) {
      console.error('Error in RegisterUserUseCase:', error);
      return { error: true, message: 'Internal server error' };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUsername(username: string): boolean {
    // Username: 3-20 characters, alphanumeric and underscore
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  private generateVerificationCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  private async saveVerificationCode(email: string, code: number): Promise<void> {
    // Delegate to repository (specific method)
    await this.userRepository.saveVerificationCode(email, code);
  }

  private async validateVerificationCode(email: string, code: number): Promise<boolean> {
    // Delegate to repository (specific method)
    return await this.userRepository.validateVerificationCode(email, code);
  }

  private async deleteVerificationCode(email: string): Promise<void> {
    // Delegate to repository (specific method)
    await this.userRepository.deleteVerificationCode(email);
  }
}
