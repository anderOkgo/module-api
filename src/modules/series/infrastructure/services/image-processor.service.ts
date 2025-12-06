import { ImageProcessor } from '../../../../infrastructure/services/image';
import { ImageProcessorPort } from '../../domain/ports/image-processor.port';
import path from 'path';

/**
 * Image processing service specific for series
 * Implements the domain port for image handling
 */
export class SeriesImageProcessorService implements ImageProcessorPort {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'series', 'img', 'tarjeta');

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    const optimizedImageBuffer = await ImageProcessor.optimizeImage(imageBuffer);
    // Agregar timestamp al nombre para forzar recarga del navegador
    const timestamp = Date.now();
    const filename = `${seriesId}_${timestamp}.jpg`;
    await ImageProcessor.saveOptimizedImage(optimizedImageBuffer, filename, this.UPLOAD_DIR);
    return `/img/tarjeta/${filename}`;
  }

  async deleteImage(imagePath: string): Promise<void> {
    // Path comes as "/img/tarjeta/486.jpg"
    // We need to build the complete path: "uploads/series/img/tarjeta/486.jpg"
    const fullPath = path.join(process.cwd(), 'uploads', 'series', imagePath);
    if (ImageProcessor.deleteImage) {
      await ImageProcessor.deleteImage(fullPath);
    }
  }
}
