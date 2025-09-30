import { ImageProcessorPort } from '../../domain/ports/image-processor.port';

/**
 * Servicio de aplicación para manejo de imágenes
 * Orquesta la lógica de procesamiento de imágenes
 */
export class ImageService {
  constructor(private readonly imageProcessor: ImageProcessorPort) {}

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    // Lógica de negocio: validaciones, reglas de negocio, etc.
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image buffer is required');
    }

    if (seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    // Delegar al adaptador de infraestructura
    return await this.imageProcessor.processAndSaveImage(imageBuffer, seriesId);
  }

  async deleteImage(imagePath: string): Promise<void> {
    // Lógica de negocio: validaciones
    if (!imagePath || imagePath.trim() === '') {
      throw new Error('Image path is required');
    }

    // Delegar al adaptador de infraestructura
    return await this.imageProcessor.deleteImage(imagePath);
  }
}
