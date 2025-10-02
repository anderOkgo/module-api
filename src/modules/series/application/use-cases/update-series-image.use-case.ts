import { ProductionRepository } from '../ports/series.repository';
import { ImageService } from '../services/image.service';
import { SeriesResponse } from '../../domain/entities/series.entity';

/**
 * Caso de uso para actualizar la imagen de una serie
 * Orquesta la eliminación de imagen anterior y guardado de la nueva
 */
export class UpdateSeriesImageUseCase {
  constructor(private readonly repository: ProductionRepository, private readonly imageService: ImageService) {}

  async execute(id: number, imageBuffer: Buffer): Promise<SeriesResponse> {
    try {
      // 1. Validar entrada
      this.validateInput(id, imageBuffer);

      // 2. Verificar que la serie existe
      const existingSeries = await this.repository.findById(id);
      if (!existingSeries) {
        throw new Error('Series not found');
      }

      // 3. Eliminar imagen anterior si existe
      if (existingSeries.image && existingSeries.image.trim() !== '') {
        try {
          await this.imageService.deleteImage(existingSeries.image);
        } catch (error) {
          console.warn(`Could not delete old image for series ${id}:`, error);
          // No fallar la actualización si la imagen antigua no se puede eliminar
        }
      }

      // 4. Procesar y guardar nueva imagen
      const imagePath = await this.imageService.processAndSaveImage(imageBuffer, id);

      // 5. Actualizar ruta en BD
      await this.repository.updateImage(id, imagePath);

      // 6. Obtener serie actualizada
      const updatedSeries = await this.repository.findById(id);
      if (!updatedSeries) {
        throw new Error('Series not found after updating image');
      }

      return this.buildResponse(updatedSeries);
    } catch (error) {
      throw new Error(`Error updating series image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(id: number, imageBuffer: Buffer): void {
    if (!id || id <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image buffer is required');
    }

    // Validar tamaño máximo (ej. 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (imageBuffer.length > MAX_SIZE) {
      throw new Error(`Image size must not exceed ${MAX_SIZE / 1024 / 1024} MB`);
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
