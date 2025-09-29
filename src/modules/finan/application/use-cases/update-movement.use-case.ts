import { FinanRepository } from '../ports/finan.repository';
import { FinanMysqlRepository } from '../../infrastructure/persistence/finan.mysql';

export class UpdateMovementUseCase {
  private repository: FinanRepository;

  constructor(repository?: FinanRepository) {
    this.repository = repository || new FinanMysqlRepository();
  }

  async execute(id: number, updatedMovement: any): Promise<any> {
    return await this.repository.updateMovementById(id, updatedMovement);
  }
}
