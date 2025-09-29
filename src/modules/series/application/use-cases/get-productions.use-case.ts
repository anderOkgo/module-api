import { ProductionRepository } from '../ports/series.repository';
import { ProductionMysqlRepository } from '../../infrastructure/persistence/series.mysql';

export class GetProductionsUseCase {
  private repository: ProductionRepository;

  constructor(repository?: ProductionRepository) {
    // Usar el repositorio inyectado o crear uno por defecto
    this.repository = repository || new ProductionMysqlRepository();
  }

  async execute(filters: any): Promise<any> {
    // Usar la lógica existente del repositorio
    return await this.repository.getProduction(filters);
  }
}
