import { SeriesImageProcessorService } from './image-processor.service';

export class ImageService {
  constructor(private readonly imageProcessor: SeriesImageProcessorService) {}

  async processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string> {
    return await this.imageProcessor.processAndSaveImage(imageBuffer, seriesId);
  }

  async deleteImage(imagePath: string): Promise<void> {
    return await this.imageProcessor.deleteImage(imagePath);
  }
}
