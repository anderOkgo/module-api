import { ProductionRepository } from '../ports/series.repository';
import { ProductionMysqlRepository } from '../../infrastructure/persistence/series.mysql';

export class GetProductionYearsUseCase {
  private repository: ProductionRepository;

  constructor(repository?: ProductionRepository) {
    // Usar el repositorio inyectado o crear uno por defecto
    this.repository = repository || new ProductionMysqlRepository();
  }

  async execute(): Promise<any> {
    // Usar la lógica existente del repositorio
    return await this.repository.getProductionYears();
  }
}
