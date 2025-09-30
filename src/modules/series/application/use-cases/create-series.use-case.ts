import { SeriesCreateRequest } from '../../domain/entities/series.entity';
import { ProductionRepository } from '../ports/series.repository';
import { ImageService } from '../services/image.service';

export class CreateSeriesUseCase {
  constructor(private readonly repository: ProductionRepository, private readonly imageService: ImageService) {}

  async execute(seriesData: SeriesCreateRequest, imageBuffer?: Buffer): Promise<any> {
    try {
      const newSeries = await this.repository.create(seriesData);
      let imagePath: string | null = null;

      if (imageBuffer) {
        imagePath = await this.imageService.processAndSaveImage(imageBuffer, newSeries.id);
        await this.repository.updateImage(newSeries.id, imagePath);
      }

      return { ...newSeries, image: imagePath || undefined };
    } catch (error) {
      throw new Error(`Error creating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
