import { ImageProcessor } from '../../../../infrastructure/services/image';
import { ImageProcessorPort } from '../../domain/ports/image-processor.port';
import path from 'path';

/**
 * Servicio de procesamiento de imágenes específico para series
 * Implementa el puerto de dominio para manejo de imágenes
 */
export class SeriesImageProcessorService implements ImageProcessorPort {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta');

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    const optimizedImageBuffer = await ImageProcessor.optimizeImage(imageBuffer);
    const filename = `${seriesId}.jpg`;
    await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
    return `/img/tarjeta/${filename}`;
  }

  async deleteImage(imagePath: string): Promise<void> {
    // La ruta viene como "/img/tarjeta/486.jpg"
    // Necesitamos construir la ruta completa: "uploads/series/img/tarjeta/486.jpg"
    const fullPath = path.join(process.cwd(), 'uploads', 'series', imagePath);
    if (ImageProcessor.deleteImage) {
      await ImageProcessor.deleteImage(fullPath);
    }
  }
}
