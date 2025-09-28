import Login from '../../domain/models/Login';
import { LoginResponse } from '../../domain/models/User';
import { AuthService } from '../../domain/services/auth.service';
import { getAuthService } from '../../domain/services/auth.factory';
import { UserRequestValidator } from '../validators/user-request.validator';

export class LoginUserUseCase {
  private authService: AuthService;

  constructor() {
    this.authService = getAuthService();
  }

  async execute(loginData: Login): Promise<{ error: boolean; message?: string; data?: LoginResponse }> {
    // Validar datos de entrada
    const validation = UserRequestValidator.validateLogin(loginData);
    if (validation.error) {
      return {
        error: true,
        message: validation.message,
        data: { details: validation.details } as any,
      };
    }

    return await this.authService.loginUser(loginData);
  }
}
