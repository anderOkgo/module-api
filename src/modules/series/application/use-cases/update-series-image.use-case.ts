import { ProductionRepository } from '../ports/series.repository';
import { ProductionMysqlRepository } from '../../infrastructure/persistence/series.mysql';
import { ImageProcessor } from '../../../../infrastructure/services/image';
import path from 'path';

export class UpdateSeriesImageUseCase {
  private repository: ProductionRepository;
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta');

  constructor(repository?: ProductionRepository) {
    this.repository = repository || new ProductionMysqlRepository();
  }

  async execute(id: number, imageBuffer: Buffer): Promise<any> {
    try {
      const existingSeries = await this.repository.findById(id);
      if (!existingSeries) {
        throw new Error('Serie no encontrada');
      }

      // Eliminar imagen anterior si existe
      if (existingSeries.image) {
        const oldImagePath = path.join(this.UPLOAD_DIR, path.basename(existingSeries.image));
        try {
          if (ImageProcessor.deleteImage) {
            await ImageProcessor.deleteImage(oldImagePath);
          }
        } catch (error) {
          // Log pero no fallar si no se puede eliminar la imagen anterior
          console.warn('Could not delete old image:', error);
        }
      }

      // Procesar y guardar nueva imagen
      const optimizedImageBuffer = await ImageProcessor.optimizeImage(imageBuffer);
      const filename = `${id}.jpg`;
      await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);

      // Guardar ruta web relativa en BD
      const imagePath = `/img/tarjeta/${filename}`;
      await this.repository.updateImage(id, imagePath);

      // Retornar serie actualizada
      const updatedSeries = await this.repository.findById(id);
      if (!updatedSeries) {
        throw new Error('Serie no encontrada después de actualizar imagen');
      }

      return updatedSeries;
    } catch (error) {
      throw new Error(`Error updating series image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
