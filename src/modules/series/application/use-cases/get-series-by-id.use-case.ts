import { ProductionRepository } from '../ports/series.repository';
import { ProductionMysqlRepository } from '../../infrastructure/persistence/series.mysql';

export class GetSeriesByIdUseCase {
  private repository: ProductionRepository;

  constructor(repository?: ProductionRepository) {
    this.repository = repository || new ProductionMysqlRepository();
  }

  async execute(id: number): Promise<any> {
    return await this.repository.findById(id);
  }
}
