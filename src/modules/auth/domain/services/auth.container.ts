import { AuthService } from './auth.service';
import { UserRepository } from '../../infrastructure/repositories/user.repository';
import { userMysqlRepository } from '../../infrastructure/user.mysql';

// Contenedor de dependencias simple
class AuthContainer {
  private static instance: AuthContainer;
  private authService: AuthService | null = null;

  private constructor() {}

  static getInstance(): AuthContainer {
    if (!AuthContainer.instance) {
      AuthContainer.instance = new AuthContainer();
    }
    return AuthContainer.instance;
  }

  getAuthService(): AuthService {
    if (!this.authService) {
      const userRepository: UserRepository = new userMysqlRepository();
      this.authService = new AuthService(userRepository);
    }
    return this.authService;
  }

  // Método para testing - permite inyectar un mock
  setAuthService(authService: AuthService): void {
    this.authService = authService;
  }

  // Método para resetear (útil en testing)
  reset(): void {
    this.authService = null;
  }
}

export const authContainer = AuthContainer.getInstance();
export default authContainer;
