import { CommandHandler } from '../../common/command.interface';
import { CreateSeriesCommand } from '../../commands/create-series.command';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { ImageService } from '../../services/image.service';

export class CreateSeriesHandler implements CommandHandler<CreateSeriesCommand, SeriesResponse> {
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly imageService: ImageService
  ) {}

  async execute(command: CreateSeriesCommand): Promise<SeriesResponse> {
    // 1. Validar
    this.validate(command);

    // 2. Normalizar
    const normalizedData = this.normalize(command);

    // 3. Crear serie
    const newSeries = await this.writeRepository.create(normalizedData);

    // 4. Procesar imagen
    let imagePath: string | undefined;
    if (command.imageBuffer) {
      try {
        imagePath = await this.imageService.processAndSaveImage(command.imageBuffer, newSeries.id);
        await this.writeRepository.updateImage(newSeries.id, imagePath);
      } catch (error) {
        console.warn(`Image processing failed for series ${newSeries.id}:`, error);
      }
    }

    // 5. Actualizar ranking
    await this.writeRepository.updateRank();

    // 6. Retornar respuesta
    return {
      id: newSeries.id,
      name: normalizedData.name,
      chapter_number: normalizedData.chapter_number,
      year: normalizedData.year,
      description: normalizedData.description,
      qualification: normalizedData.qualification,
      demography_id: normalizedData.demography_id,
      visible: normalizedData.visible,
      image: imagePath,
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
  }

  private normalize(command: CreateSeriesCommand) {
    return {
      name: command.name.trim(),
      chapter_number: command.chapter_number,
      year: command.year,
      description: command.description?.trim() || '',
      qualification: command.qualification,
      demography_id: command.demography_id,
      visible: command.visible ?? true,
    };
  }
}
