import Login from '../../domain/entities/login.entity';
import { LoginResponse } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository';
import { userMysqlRepository } from '../../infrastructure/persistence/user.mysql';

export class LoginUserUseCase {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    // Usar el repositorio inyectado o crear uno por defecto
    this.userRepository = userRepository || new userMysqlRepository();
  }

  async execute(loginData: Login): Promise<{ error: boolean; message?: string; data?: LoginResponse }> {
    // Usar la lógica existente del repositorio
    return await this.userRepository.loginUser(loginData);
  }
}
