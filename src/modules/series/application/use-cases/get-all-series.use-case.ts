import { ProductionRepository } from '../ports/series.repository';
import { SeriesResponse } from '../../domain/entities/series.entity';

/**
 * Caso de uso para obtener todas las series con paginación
 * Valida parámetros y orquesta la obtención de múltiples series
 */
export class GetAllSeriesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(
    limit?: number,
    offset?: number
  ): Promise<{ series: SeriesResponse[]; pagination: { limit: number; offset: number; total: number } }> {
    try {
      // 1. Validar y normalizar entrada
      const normalizedLimit = this.validateAndNormalizeLimit(limit);
      const normalizedOffset = this.validateAndNormalizeOffset(offset);

      // 2. Obtener series
      const series = await this.repository.findAll(normalizedLimit, normalizedOffset);

      // 3. Mapear a respuesta
      const mappedSeries = series.map((s) => this.buildResponse(s));

      return {
        series: mappedSeries,
        pagination: {
          limit: normalizedLimit,
          offset: normalizedOffset,
          total: mappedSeries.length,
        },
      };
    } catch (error) {
      throw new Error(`Error getting all series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateAndNormalizeLimit(limit?: number): number {
    if (limit === undefined || limit === null) {
      return 50; // Default
    }

    if (limit < 1) {
      throw new Error('Limit must be at least 1');
    }

    if (limit > 500) {
      throw new Error('Limit must not exceed 500');
    }

    return limit;
  }

  private validateAndNormalizeOffset(offset?: number): number {
    if (offset === undefined || offset === null) {
      return 0; // Default
    }

    if (offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    return offset;
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
