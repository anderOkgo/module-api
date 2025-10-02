import Login from '../../domain/entities/login.entity';
import { LoginResponse, UserResponse } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
import { TokenGeneratorPort } from '../../domain/ports/token-generator.port';

/**
 * Caso de uso para login de usuarios
 * Implementa toda la lógica de autenticación
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
      // 1. Validar que se proporcione username o email
      const loginIdentifier = loginData.email ?? loginData.username;
      if (!loginIdentifier) {
        return { error: true, message: 'Username or email is required' };
      }

      // 2. Buscar usuario por email o username
      const user = await this.userRepository.findByEmailOrUsername(
        loginData.email ?? '',
        loginData.username ?? ''
      );

      if (!user) {
        return { error: true, message: 'Invalid credentials' };
      }

      // 3. Verificar si la cuenta está activa
      if (!user.active) {
        return { error: true, message: 'Account is inactive' };
      }

      // 4. Verificar si la cuenta está bloqueada
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { error: true, message: 'Account is temporarily locked' };
      }

      // 5. Comparar password
      const isValidPassword = await this.passwordHasher.compare(loginData.password, user.password);

      if (!isValidPassword) {
        // Incrementar intentos fallidos
        await this.userRepository.incrementLoginAttempts(user.id!);

        // Bloquear cuenta si hay muchos intentos
        if ((user.login_attempts ?? 0) >= 4) {
          const lockUntil = new Date();
          lockUntil.setMinutes(lockUntil.getMinutes() + 15); // Bloquear por 15 minutos
          await this.userRepository.lockUser(user.id!, lockUntil);
          return { error: true, message: 'Too many failed attempts. Account locked for 15 minutes' };
        }

        return { error: true, message: 'Invalid credentials' };
      }

      // 6. Resetear intentos de login y actualizar last_login
      await this.userRepository.resetLoginAttempts(user.id!);
      await this.userRepository.updateLastLogin(user.id!);

      // 7. Generar token JWT
      const token = this.tokenGenerator.generate({
        userId: user.id!,
        username: user.username,
        role: user.role,
      });

      // 8. Mapear respuesta del usuario
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
        expiresIn: 86400, // 24 horas en segundos
      };

      return {
        error: false,
        token, // Mantener compatibilidad con formato anterior
        data: loginResponse,
      };
    } catch (error) {
      console.error('Error in LoginUserUseCase:', error);
      return { error: true, message: 'Internal server error' };
    }
  }
}
