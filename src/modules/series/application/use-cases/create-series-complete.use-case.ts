import { ProductionRepository } from '../ports/series.repository';
import { SeriesCreateRequest, SeriesResponse } from '../../domain/entities/series.entity';

export interface CreateSeriesCompleteRequest {
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
  genres?: number[];
  titles?: string[];
}

/**
 * Caso de uso para crear una serie completa con géneros y títulos
 * Orquesta la creación en múltiples pasos de manera transaccional
 */
export class CreateSeriesCompleteUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesData: CreateSeriesCompleteRequest): Promise<SeriesResponse> {
    try {
      // 1. Validar entrada
      this.validateInput(seriesData);

      // 2. Normalizar datos
      const normalizedData = this.normalizeData(seriesData);

      // 3. Crear la serie básica
      const basicSeriesData: SeriesCreateRequest = {
        name: normalizedData.name,
        chapter_number: normalizedData.chapter_number,
        year: normalizedData.year,
        description: normalizedData.description,
        qualification: normalizedData.qualification,
        demography_id: normalizedData.demography_id,
        visible: normalizedData.visible,
      };

      const newSeries = await this.repository.create(basicSeriesData);

      // 4. Asignar géneros si se proporcionan
      if (normalizedData.genres && normalizedData.genres.length > 0) {
        await this.repository.assignGenres(newSeries.id, normalizedData.genres);
      }

      // 5. Agregar títulos alternativos si se proporcionan
      if (normalizedData.titles && normalizedData.titles.length > 0) {
        await this.repository.addTitles(newSeries.id, normalizedData.titles);
      }

      // 6. Actualizar el ranking
      await this.repository.updateRank();

      // 7. Obtener la serie completa con relaciones
      const completeSeries = await this.repository.findById(newSeries.id);
      if (!completeSeries) {
        throw new Error('Series created but not found');
      }

      return this.buildResponse(completeSeries);
    } catch (error) {
      throw new Error(
        `Error creating complete series: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private validateInput(data: CreateSeriesCompleteRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Series name is required');
    }

    if (data.name.trim().length < 2 || data.name.trim().length > 200) {
      throw new Error('Series name must be between 2 and 200 characters');
    }

    if (data.chapter_number < 0) {
      throw new Error('Chapter number must be positive');
    }

    if (data.year < 1900 || data.year > new Date().getFullYear() + 5) {
      throw new Error(`Year must be between 1900 and ${new Date().getFullYear() + 5}`);
    }

    if (data.qualification < 0 || data.qualification > 10) {
      throw new Error('Qualification must be between 0 and 10');
    }

    if (!data.demography_id || data.demography_id <= 0) {
      throw new Error('Valid demography_id is required');
    }

    if (data.genres && !Array.isArray(data.genres)) {
      throw new Error('Genres must be an array');
    }

    if (data.titles && !Array.isArray(data.titles)) {
      throw new Error('Titles must be an array');
    }
  }

  private normalizeData(data: CreateSeriesCompleteRequest): CreateSeriesCompleteRequest {
    const normalized: CreateSeriesCompleteRequest = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      visible: data.visible ?? true,
    };

    if (data.genres) {
      normalized.genres = [...new Set(data.genres)].filter((id) => id > 0);
    }

    if (data.titles) {
      normalized.titles = data.titles
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .filter((t, i, self) => self.indexOf(t) === i);
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
