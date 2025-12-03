import { CommandHandler } from '../../common/command.interface';
import { CreateSeriesCommand } from '../../commands/create-series.command';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';
import { ImageService } from '../../services/image.service';

export class CreateSeriesHandler implements CommandHandler<CreateSeriesCommand, SeriesResponse> {
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository,
    private readonly imageService: ImageService
  ) {}

  async execute(command: CreateSeriesCommand): Promise<SeriesResponse> {
    // 1. Validate
    this.validate(command);

    // 2. Normalize
    const normalizedData = this.normalize(command);

    // 3. Check for duplicate (name + year)
    const existingSeries = await this.readRepository.findByNameAndYear(normalizedData.name, normalizedData.year);
    let seriesId: number;

    if (existingSeries) {
      // 4a. Update existing series
      seriesId = existingSeries.id;
      await this.writeRepository.update(seriesId, {
        id: seriesId,
        name: normalizedData.name,
        chapter_number: normalizedData.chapter_number,
        year: normalizedData.year,
        description: normalizedData.description,
        description_en: normalizedData.description_en,
        qualification: normalizedData.qualification,
        demography_id: normalizedData.demography_id,
        visible: normalizedData.visible,
      });
    } else {
      // 4b. Create new series
      const newSeries = await this.writeRepository.create(normalizedData);
      seriesId = newSeries.id;
    }

    // 5. Process image
    let imagePath: string | undefined;
    if (command.imageBuffer) {
      try {
        imagePath = await this.imageService.processAndSaveImage(command.imageBuffer, seriesId);
        await this.writeRepository.updateImage(seriesId, imagePath);
      } catch (error) {
        console.warn(`Image processing failed for series ${seriesId}:`, error);
      }
    }

    // 6. Update ranking
    await this.writeRepository.updateRank();

    // 7. Get updated/created series to return complete response
    const series = await this.readRepository.findById(seriesId);
    if (!series) {
      throw new Error(`Failed to retrieve series with id ${seriesId}`);
    }

    // 8. Return response with image path if processed
    return {
      ...series,
      image: imagePath ?? series.image,
    };
  }

  private validate(command: CreateSeriesCommand): void {
    if (!command.name || command.name.trim().length < 2) {
      throw new Error('Series name must be at least 2 characters');
    }
    if (command.name.trim().length > 200) {
      throw new Error('Series name must not exceed 200 characters');
    }
    if (command.chapter_number < 0) {
      throw new Error('Chapter number must be positive');
    }
    if (command.year < 1900 || command.year > new Date().getFullYear() + 5) {
      throw new Error(`Year must be between 1900 and ${new Date().getFullYear() + 5}`);
    }
    if (command.qualification < 0 || command.qualification > 10) {
      throw new Error('Qualification must be between 0 and 10');
    }
    if (!command.demography_id || command.demography_id <= 0) {
      throw new Error('Valid demography_id is required');
    }
    if (command.description && command.description.length > 5000) {
      throw new Error('Description must not exceed 5000 characters');
    }
    if (command.description_en && command.description_en.length > 5000) {
      throw new Error('Description_en must not exceed 5000 characters');
    }
  }

  private normalize(command: CreateSeriesCommand) {
    return {
      name: command.name.trim(),
      chapter_number: command.chapter_number,
      year: command.year,
      description: command.description?.trim() || '',
      description_en: command.description_en?.trim() || '',
      qualification: command.qualification,
      demography_id: command.demography_id,
      visible: command.visible ?? true,
    };
  }
}
