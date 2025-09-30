import { ProductionRepository } from '../ports/series.repository';
import { ImageService } from '../services/image.service';

export class DeleteSeriesUseCase {
  constructor(private readonly repository: ProductionRepository, private readonly imageService: ImageService) {}

  async execute(id: number): Promise<boolean> {
    try {
      // 1. Obtener la serie para verificar si tiene imagen
      const series = await this.repository.findById(id);
      if (!series) {
        return false;
      }

      // 2. Eliminar la imagen del filesystem si existe
      if (series.image) {
        try {
          await this.imageService.deleteImage(series.image);
        } catch (error) {
          console.warn(`Could not delete image for series ${id}:`, error);
          // No fallar la eliminación si no se puede borrar la imagen
        }
      }

      // 3. Eliminar la serie de la base de datos
      const deleted = await this.repository.delete(id);
      return deleted;
    } catch (error) {
      throw new Error(`Error deleting series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
