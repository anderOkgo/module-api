import { ImageProcessorPort } from '../../domain/ports/image-processor.port';

/**
 * Application service for image handling
 * Orchestrates image processing logic
 */
export class ImageService {
  constructor(private readonly imageProcessor: ImageProcessorPort) {}

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    // Business logic: validations, business rules, etc.
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('Image buffer is required');
    }

    if (seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    // Delegate to infrastructure adapter
    return await this.imageProcessor.processAndSaveImage(imageBuffer, seriesId);
  }

  async deleteImage(imagePath: string): Promise<void> {
    // Business logic: validations
    if (!imagePath || imagePath.trim() === '') {
      throw new Error('Image path is required');
    }

    // Delegate to infrastructure adapter
    return await this.imageProcessor.deleteImage(imagePath);
  }
}
