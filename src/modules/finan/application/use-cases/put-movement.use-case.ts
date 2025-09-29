import { FinanRepository } from '../ports/finan.repository';
import { FinanMysqlRepository } from '../../infrastructure/persistence/finan.mysql';

export class PutMovementUseCase {
  private repository: FinanRepository;

  constructor(repository?: FinanRepository) {
    this.repository = repository || new FinanMysqlRepository();
  }

  async execute(movement: any): Promise<any> {
    return await this.repository.putMovement(movement);
  }
}
