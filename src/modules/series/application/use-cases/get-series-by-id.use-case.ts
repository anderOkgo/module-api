import { ProductionRepository } from '../ports/series.repository';
import { SeriesResponse } from '../../domain/entities/series.entity';

/**
 * Caso de uso para obtener una serie por su ID
 * Valida y orquesta la obtención de una serie específica
 */
export class GetSeriesByIdUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(id: number): Promise<SeriesResponse | null> {
    try {
      // 1. Validar entrada
      this.validateInput(id);

      // 2. Buscar la serie
      const series = await this.repository.findById(id);

      if (!series) {
        return null;
      }

      // 3. Construir respuesta
      return this.buildResponse(series);
    } catch (error) {
      throw new Error(`Error getting series by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(id: number): void {
    if (!id || id <= 0) {
      throw new Error('Valid series ID is required');
    }
  }

  private buildResponse(series: any): SeriesResponse {
    return {
      id: series.id,
      name: series.name,
      chapter_number: series.chapter_numer ?? series.chapter_number,
      year: series.year,
      description: series.description,
      qualification: series.qualification,
      demography_id: series.demography_id,
      demographic_name: series.demographic_name,
      visible: series.visible,
      image: series.image,
      rank: series.rank,
    };
  }
}
