import Login from '../../domain/entities/login.entity';
import { LoginResponse } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository';

export class LoginUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(loginData: Login): Promise<{ error: boolean; message?: string; data?: LoginResponse }> {
    // Usar la lógica existente del repositorio
    return await this.userRepository.loginUser(loginData);
  }
}
