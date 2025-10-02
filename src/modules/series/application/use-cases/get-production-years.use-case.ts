import { ProductionRepository } from '../ports/series.repository';
import Year from '../../domain/entities/year.entity';

/**
 * Caso de uso para obtener todos los años de producción disponibles
 * Utilizado para catálogos y filtros
 */
export class GetProductionYearsUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(): Promise<{ years: Year[]; total: number }> {
    try {
      // Obtener años
      const years = await this.repository.getProductionYears();

      return {
        years,
        total: years.length,
      };
    } catch (error) {
      throw new Error(
        `Error getting production years: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
