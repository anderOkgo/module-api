import { UserCreateRequest, UserResponse } from '../../domain/models/User';
import { AuthService } from '../../domain/services/auth.service';
import { getAuthService } from '../../domain/services/auth.factory';
import { UserRequestValidator } from '../validators/user-request.validator';

export class RegisterUserUseCase {
  private authService: AuthService;

  constructor() {
    this.authService = getAuthService();
  }

  async execute(userData: UserCreateRequest): Promise<{ error: boolean; message?: string; data?: UserResponse }> {
    // Validar datos de entrada
    const validation = UserRequestValidator.validateUserCreate(userData);
    if (validation.error) {
      return {
        error: true,
        message: validation.message,
        data: { details: validation.details } as any,
      };
    }

    return await this.authService.registerUser(userData);
  }
}
