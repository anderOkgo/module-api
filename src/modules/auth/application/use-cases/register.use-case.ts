import { UserCreateRequest, UserResponse } from '../../domain/entities/user.entity';
import { UserRepository } from '../ports/user.repository';
import { userMysqlRepository } from '../../infrastructure/persistence/user.mysql';

export class RegisterUserUseCase {
  private userRepository: UserRepository;

  constructor(userRepository?: UserRepository) {
    // Usar el repositorio inyectado o crear uno por defecto
    this.userRepository = userRepository || new userMysqlRepository();
  }

  async execute(userData: UserCreateRequest): Promise<{ error: boolean; message?: string; data?: UserResponse }> {
    // Usar la lógica existente del repositorio
    return await this.userRepository.addUser(userData);
  }
}
