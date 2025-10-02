import { SeriesCreateRequest, SeriesResponse } from '../../domain/entities/series.entity';
import { ProductionRepository } from '../ports/series.repository';
import { ImageService } from '../services/image.service';

/**
 * Caso de uso para crear una nueva serie
 * Orquesta la creación de la serie y el procesamiento de su imagen
 */
export class CreateSeriesUseCase {
  constructor(private readonly repository: ProductionRepository, private readonly imageService: ImageService) {}

  async execute(seriesData: SeriesCreateRequest, imageBuffer?: Buffer): Promise<SeriesResponse> {
    try {
      // 1. Validar entrada
      this.validateInput(seriesData);

      // 2. Normalizar datos
      const normalizedData = this.normalizeData(seriesData);

      // 3. Crear la serie en BD
      const newSeries = await this.repository.create(normalizedData);

      // 4. Procesar imagen si existe
      let imagePath: string | undefined;
      if (imageBuffer && imageBuffer.length > 0) {
        try {
          imagePath = await this.imageService.processAndSaveImage(imageBuffer, newSeries.id);
          await this.repository.updateImage(newSeries.id, imagePath);
        } catch (error) {
          console.warn(`Image processing failed for series ${newSeries.id}:`, error);
          // No fallar la creación si la imagen falla
        }
      }

      // 5. Actualizar el ranking
      await this.repository.updateRank();

      // 6. Construir respuesta
      return this.buildResponse(newSeries, imagePath);
    } catch (error) {
      throw new Error(`Error creating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(data: SeriesCreateRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Series name is required');
    }

    if (data.name.trim().length < 2) {
      throw new Error('Series name must be at least 2 characters');
    }

    if (data.name.trim().length > 200) {
      throw new Error('Series name must not exceed 200 characters');
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

    if (data.description && data.description.length > 5000) {
      throw new Error('Description must not exceed 5000 characters');
    }
  }

  private normalizeData(data: SeriesCreateRequest): SeriesCreateRequest {
    return {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      visible: data.visible ?? true,
    };
  }

  private buildResponse(series: any, imagePath?: string): SeriesResponse {
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
      image: imagePath ?? series.image,
      rank: series.rank,
    };
  }
}
