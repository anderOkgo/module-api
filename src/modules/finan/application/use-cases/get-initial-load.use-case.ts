import { FinanRepository } from '../ports/finan.repository';
import { FinanMysqlRepository } from '../../infrastructure/persistence/finan.mysql';

export class GetInitialLoadUseCase {
  private repository: FinanRepository;

  constructor(repository?: FinanRepository) {
    this.repository = repository || new FinanMysqlRepository();
  }

  async execute(data: any): Promise<any> {
    return await this.repository.getInitialLoad(data);
  }
}
