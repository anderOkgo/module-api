import { AuthService } from './auth.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { userMysqlRepository } from '../../infrastructure/user.mysql';

// Factory pattern para crear servicios de autenticación
export class AuthServiceFactory {
  private static authService: AuthService | null = null;

  // Método principal para obtener el servicio
  static getAuthService(): AuthService {
    if (!this.authService) {
      const userRepository: UserRepository = new userMysqlRepository();
      this.authService = new AuthService(userRepository);
    }
    return this.authService;
  }

  // Método para testing - permite inyectar dependencias mock
  static createAuthService(userRepository: UserRepository): AuthService {
    return new AuthService(userRepository);
  }

  // Método para resetear (útil en testing)
  static reset(): void {
    this.authService = null;
  }
}

// Exportar función helper para uso directo
export const getAuthService = () => AuthServiceFactory.getAuthService();
export default AuthServiceFactory;
