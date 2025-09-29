import { FinanRepository } from '../ports/finan.repository';
import { FinanMysqlRepository } from '../../infrastructure/persistence/finan.mysql';

export class DeleteMovementUseCase {
  private repository: FinanRepository;

  constructor(repository?: FinanRepository) {
    this.repository = repository || new FinanMysqlRepository();
  }

  async execute(id: number, username: string): Promise<any> {
    return await this.repository.deleteMovementById(id, username);
  }
}
