import { CommandHandler } from '../../common/command.interface';
import {
  CreateSeriesCompleteCommand,
  CreateSeriesCompleteRequest,
} from '../../commands/create-series-complete.command';
import { SeriesWriteRepository } from '../../ports/series-write.repository';
import { SeriesReadRepository } from '../../ports/series-read.repository';
import { SeriesCreateRequest } from '../../../domain/entities/series.entity';

/**
 * Handler para crear una serie completa con géneros y títulos
 * Orquesta la creación en múltiples pasos de manera transaccional
 * // Validated under FULLTEST
 */
export class CreateSeriesCompleteHandler
  implements CommandHandler<CreateSeriesCompleteCommand, { success: boolean; message: string; id?: number }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(
    command: CreateSeriesCompleteCommand
  ): Promise<{ success: boolean; message: string; id?: number }> {
    try {
      const { seriesData } = command;

      // 1. Validar entrada
      this.validateInput(seriesData);

      // 2. Normalizar datos
      const normalized = this.normalizeData(seriesData);

      // 3. Crear la serie básica
      const basicSeriesData: SeriesCreateRequest = {
        name: normalized.name,
        chapter_number: normalized.chapter_number,
        year: normalized.year,
        description: normalized.description,
        qualification: normalized.qualification,
        demography_id: normalized.demography_id,
        visible: normalized.visible,
      };

      const newSeries = await this.writeRepository.create(basicSeriesData);
      const newSeriesId = newSeries.id;

      // 4. Asignar géneros si se proporcionan
      if (normalized.genres && normalized.genres.length > 0) {
        await this.writeRepository.assignGenres(newSeriesId, normalized.genres);
      }

      // 5. Agregar títulos alternativos si se proporcionan
      if (normalized.titles && normalized.titles.length > 0) {
        await this.writeRepository.addTitles(newSeriesId, normalized.titles);
      }

      // 6. Actualizar el ranking
      await this.writeRepository.updateRank();

      // 7. Verificar que la serie se creó correctamente
      const completeSeries = await this.readRepository.findById(newSeriesId);
      if (!completeSeries) {
        throw new Error('Series created but not found');
      }

      return {
        success: true,
        message: 'Series created successfully with all relations',
        id: newSeriesId,
      };
    } catch (error) {
      throw new Error(
        `Error creating complete series: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private validateInput(data: CreateSeriesCompleteRequest): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new Error('Series name is required');
    }

    if (data.name.trim().length < 2 || data.name.trim().length > 200) {
      throw new Error('Series name must be between 2 and 200 characters');
    }

    if (data.chapter_number < 0) {
      throw new Error('Chapter number must be positive');
    }

    if (data.year < 1900 || data.year > new Date().getFullYear() + 5) {
      throw new Error(`Year must be between 1900 and ${new Date().getFullYear() + 5}`);
    }

    if (data.qualification < 0 || data.qualification > 10) {
      throw new Error('Qualification must be between 0 and 10');
    }

    if (!data.demography_id || data.demography_id <= 0) {
      throw new Error('Valid demography_id is required');
    }

    if (data.genres && !Array.isArray(data.genres)) {
      throw new Error('Genres must be an array');
    }

    if (data.titles && !Array.isArray(data.titles)) {
      throw new Error('Titles must be an array');
    }
  }

  private normalizeData(data: CreateSeriesCompleteRequest): CreateSeriesCompleteRequest {
    const normalized: CreateSeriesCompleteRequest = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() ?? '',
      visible: data.visible ?? true,
    };

    if (data.genres) {
      normalized.genres = [...new Set(data.genres)].filter((id) => id > 0);
    }

    if (data.titles) {
      normalized.titles = data.titles
        .map((t) => t.trim())
        .filter((t) => t.length > 0)
        .filter((t, i, self) => self.indexOf(t) === i);
    }

    return normalized;
  }
}
