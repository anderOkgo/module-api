import { ProductionRepository } from '../ports/series.repository';
import { Demographic } from '../../domain/entities/series.entity';

/**
 * Caso de uso para obtener todas las demografías disponibles
 * Utilizado para catálogos y filtros
 */
export class GetDemographicsUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(): Promise<{ demographics: Demographic[]; total: number }> {
    try {
      // Obtener demografías
      const demographics = await this.repository.getDemographics();

      return {
        demographics,
        total: demographics.length,
      };
    } catch (error) {
      throw new Error(`Error getting demographics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
