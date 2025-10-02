import { CommandHandler } from '../../common/command.interface';
import { UpdateSeriesImageCommand } from '../../commands/update-series-image.command';
import { SeriesWriteRepository } from '../../ports/series-write.repository';
import { SeriesReadRepository } from '../../ports/series-read.repository';
import { ImageService } from '../../services/image.service';

/**
 * Handler para actualizar la imagen de una serie
 * Orquesta la eliminación de imagen anterior y guardado de la nueva
 * // Validated under FULLTEST
 */
export class UpdateSeriesImageHandler
  implements CommandHandler<UpdateSeriesImageCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository,
    private readonly imageService: ImageService
  ) {}

  async execute(command: UpdateSeriesImageCommand): Promise<{ success: boolean; message: string }> {
    try {
      const { seriesId, imageFile } = command;

      // 1. Validar entrada
      this.validateInput(seriesId, imageFile);

      if (!imageFile) {
        throw new Error('Image file is required');
      }

      // 2. Verificar que la serie existe
      const existingSeries = await this.readRepository.findById(seriesId);
      if (!existingSeries) {
        throw new Error('Series not found');
      }

      // 3. Eliminar imagen anterior si existe
      if (existingSeries.image && existingSeries.image.trim() !== '') {
        try {
          await this.imageService.deleteImage(existingSeries.image);
        } catch (error) {
          console.warn(`Could not delete old image for series ${seriesId}:`, error);
          // No fallar la actualización si la imagen antigua no se puede eliminar
        }
      }

      // 4. Procesar y guardar nueva imagen
      const imagePath = await this.imageService.processAndSaveImage(imageFile.buffer, seriesId);

      // 5. Actualizar ruta en BD
      await this.writeRepository.updateImage(seriesId, imagePath);

      return {
        success: true,
        message: 'Series image updated successfully',
      };
    } catch (error) {
      throw new Error(`Error updating series image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(id: number, imageFile?: Express.Multer.File): void {
    if (!id || id <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!imageFile || !imageFile.buffer || imageFile.buffer.length === 0) {
      throw new Error('Image file is required');
    }

    // Validar tamaño máximo (ej. 10 MB)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (imageFile.buffer.length > MAX_SIZE) {
      throw new Error(`Image size must not exceed ${MAX_SIZE / 1024 / 1024} MB`);
    }
  }
}
