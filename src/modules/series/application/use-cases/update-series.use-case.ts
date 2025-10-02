import { ProductionRepository } from '../ports/series.repository';
import { SeriesUpdateRequest, SeriesResponse } from '../../domain/entities/series.entity';

/**
 * Caso de uso para actualizar una serie existente
 * Valida, normaliza y orquesta la actualización
 */
export class UpdateSeriesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(id: number, seriesData: SeriesUpdateRequest): Promise<SeriesResponse> {
    try {
      // 1. Validar entrada
      this.validateInput(id, seriesData);

      // 2. Verificar que la serie existe
      const existingSeries = await this.repository.findById(id);
      if (!existingSeries) {
        throw new Error('Series not found');
      }

      // 3. Normalizar datos
      const normalizedData = this.normalizeData(seriesData);

      // 4. Actualizar en BD
      const updatedSeries = await this.repository.update(id, normalizedData);

      // 5. Actualizar el ranking
      await this.repository.updateRank();

      // 6. Construir respuesta
      return this.buildResponse(updatedSeries);
    } catch (error) {
      throw new Error(`Error updating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(id: number, data: SeriesUpdateRequest): void {
    if (id <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (data.name !== undefined) {
      if (data.name.trim().length < 2) {
        throw new Error('Series name must be at least 2 characters');
      }
      if (data.name.trim().length > 200) {
        throw new Error('Series name must not exceed 200 characters');
      }
    }

    if (data.chapter_number !== undefined && data.chapter_number < 0) {
      throw new Error('Chapter number must be positive');
    }

    if (data.year !== undefined) {
      if (data.year < 1900 || data.year > new Date().getFullYear() + 5) {
        throw new Error(`Year must be between 1900 and ${new Date().getFullYear() + 5}`);
      }
    }

    if (data.qualification !== undefined) {
      if (data.qualification < 0 || data.qualification > 10) {
        throw new Error('Qualification must be between 0 and 10');
      }
    }

    if (data.demography_id !== undefined && data.demography_id <= 0) {
      throw new Error('Valid demography_id is required');
    }

    if (data.description !== undefined && data.description.length > 5000) {
      throw new Error('Description must not exceed 5000 characters');
    }

    // Verificar que al menos un campo se actualice
    const hasUpdates =
      Object.keys(data).filter((key) => key !== 'id' && data[key as keyof SeriesUpdateRequest] !== undefined)
        .length > 0;
    if (!hasUpdates) {
      throw new Error('No fields to update');
    }
  }

  private normalizeData(data: SeriesUpdateRequest): SeriesUpdateRequest {
    const normalized: SeriesUpdateRequest = { ...data };

    if (data.name !== undefined) {
      normalized.name = data.name.trim();
    }
    if (data.description !== undefined) {
      normalized.description = data.description.trim();
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
