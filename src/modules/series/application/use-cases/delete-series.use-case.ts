import { ProductionRepository } from '../ports/series.repository';
import { ImageService } from '../services/image.service';

/**
 * Caso de uso para eliminar una serie
 * Orquesta la eliminación de la serie y su imagen asociada
 */
export class DeleteSeriesUseCase {
  constructor(private readonly repository: ProductionRepository, private readonly imageService: ImageService) {}

  async execute(id: number): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar entrada
      this.validateInput(id);

      // 2. Verificar que la serie existe
      const series = await this.repository.findById(id);
      if (!series) {
        return { success: false, message: 'Series not found' };
      }

      // 3. Eliminar la imagen del filesystem si existe
      if (series.image && series.image.trim() !== '') {
        try {
          await this.imageService.deleteImage(series.image);
        } catch (error) {
          console.warn(`Could not delete image for series ${id}:`, error);
          // No fallar la eliminación completa si la imagen no se puede borrar
        }
      }

      // 4. Eliminar la serie de la base de datos
      const deleted = await this.repository.delete(id);

      if (!deleted) {
        return { success: false, message: 'Failed to delete series' };
      }

      return { success: true, message: 'Series deleted successfully' };
    } catch (error) {
      throw new Error(`Error deleting series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(id: number): void {
    if (!id || id <= 0) {
      throw new Error('Valid series ID is required');
    }
  }
}
