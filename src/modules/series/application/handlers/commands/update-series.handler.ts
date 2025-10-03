import { CommandHandler } from '../../common/command.interface';
import { UpdateSeriesCommand } from '../../commands/update-series.command';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class UpdateSeriesHandler implements CommandHandler<UpdateSeriesCommand, SeriesResponse> {
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(command: UpdateSeriesCommand): Promise<SeriesResponse> {
    // 1. Validar
    this.validate(command);

    // 2. Verificar que existe
    const existingSeries = await this.readRepository.findById(command.id);
    if (!existingSeries) {
      throw new Error('Series not found');
    }

    // 3. Normalizar
    const normalizedData = this.normalize(command);

    // 4. Actualizar
    await this.writeRepository.update(command.id, normalizedData);

    // 5. Actualizar ranking
    await this.writeRepository.updateRank();

    // 6. Obtener serie actualizada
    const updatedSeries = await this.readRepository.findById(command.id);
    if (!updatedSeries) {
      throw new Error('Series not found after update');
    }

    return updatedSeries;
  }

  private validate(command: UpdateSeriesCommand): void {
    if (command.id <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (command.name !== undefined) {
      if (command.name.trim().length < 2) {
        throw new Error('Series name must be at least 2 characters');
      }
      if (command.name.trim().length > 200) {
        throw new Error('Series name must not exceed 200 characters');
      }
    }

    if (command.chapter_number !== undefined && command.chapter_number < 0) {
      throw new Error('Chapter number must be positive');
    }

    if (command.year !== undefined) {
      if (command.year < 1900 || command.year > new Date().getFullYear() + 5) {
        throw new Error(`Year must be between 1900 and ${new Date().getFullYear() + 5}`);
      }
    }

    if (command.qualification !== undefined) {
      if (command.qualification < 0 || command.qualification > 10) {
        throw new Error('Qualification must be between 0 and 10');
      }
    }

    if (command.demography_id !== undefined && command.demography_id <= 0) {
      throw new Error('Valid demography_id is required');
    }

    if (command.description !== undefined && command.description.length > 5000) {
      throw new Error('Description must not exceed 5000 characters');
    }

    if (command.description_en !== undefined && command.description_en.length > 5000) {
      throw new Error('Description_en must not exceed 5000 characters');
    }

    // Verificar que al menos un campo se actualice
    const hasUpdates =
      command.name !== undefined ||
      command.chapter_number !== undefined ||
      command.year !== undefined ||
      command.description !== undefined ||
      command.description_en !== undefined ||
      command.qualification !== undefined ||
      command.demography_id !== undefined ||
      command.visible !== undefined;

    if (!hasUpdates) {
      throw new Error('No fields to update');
    }
  }

  private normalize(command: UpdateSeriesCommand) {
    const normalized: any = {};

    if (command.name !== undefined) {
      normalized.name = command.name.trim();
    }
    if (command.chapter_number !== undefined) {
      normalized.chapter_number = command.chapter_number;
    }
    if (command.year !== undefined) {
      normalized.year = command.year;
    }
    if (command.description !== undefined) {
      normalized.description = command.description.trim();
    }
    if (command.description_en !== undefined) {
      normalized.description_en = command.description_en.trim();
    }
    if (command.qualification !== undefined) {
      normalized.qualification = command.qualification;
    }
    if (command.demography_id !== undefined) {
      normalized.demography_id = command.demography_id;
    }
    if (command.visible !== undefined) {
      normalized.visible = command.visible;
    }

    return normalized;
  }
}
