import { ProductionRepository } from '../ports/series.repository';
import { SeriesSearchFilters, SeriesResponse } from '../../domain/entities/series.entity';

/**
 * Caso de uso para buscar series con filtros
 * Valida, normaliza y orquesta la búsqueda
 */
export class SearchSeriesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(
    filters: SeriesSearchFilters
  ): Promise<{ series: SeriesResponse[]; filters: SeriesSearchFilters }> {
    try {
      // 1. Validar entrada
      this.validateFilters(filters);

      // 2. Normalizar filtros
      const normalizedFilters = this.normalizeFilters(filters);

      // 3. Buscar series
      const series = await this.repository.search(normalizedFilters);

      // 4. Mapear a respuesta
      const mappedSeries = series.map((s) => this.buildResponse(s));

      return {
        series: mappedSeries,
        filters: normalizedFilters,
      };
    } catch (error) {
      throw new Error(`Error searching series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateFilters(filters: SeriesSearchFilters): void {
    if (filters.name && filters.name.trim().length < 2) {
      throw new Error('Search name must be at least 2 characters');
    }

    if (filters.year && (filters.year < 1900 || filters.year > new Date().getFullYear() + 5)) {
      throw new Error(`Year must be between 1900 and ${new Date().getFullYear() + 5}`);
    }

    if (filters.demography_id && filters.demography_id <= 0) {
      throw new Error('Demography ID must be positive');
    }

    if (filters.limit && filters.limit > 500) {
      throw new Error('Limit must not exceed 500');
    }

    if (filters.offset && filters.offset < 0) {
      throw new Error('Offset must be non-negative');
    }

    if (filters.genre_ids && !Array.isArray(filters.genre_ids)) {
      throw new Error('Genre IDs must be an array');
    }
  }

  private normalizeFilters(filters: SeriesSearchFilters): SeriesSearchFilters {
    const normalized: SeriesSearchFilters = {
      ...filters,
      limit: filters.limit ?? 100,
      offset: filters.offset ?? 0,
    };

    if (filters.name) {
      normalized.name = filters.name.trim();
    }

    return normalized;
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
