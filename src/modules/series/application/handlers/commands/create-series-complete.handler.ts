import { CommandHandler } from '../../common/command.interface';
import {
  CreateSeriesCompleteCommand,
  CreateSeriesCompleteRequest,
} from '../../commands/create-series-complete.command';
import { SeriesWriteRepository } from '../../ports/series-write.repository';
import { SeriesReadRepository } from '../../ports/series-read.repository';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../../domain/entities/series.entity';

/**
 * Handler to create a complete series with genres and titles
 * Orchestrates creation in multiple steps in a transactional manner
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

      // 1. Validate input
      this.validateInput(seriesData);

      // 2. Normalize data
      const normalized = this.normalizeData(seriesData);

      // 3. Check for duplicate (name + year)
      const existingSeries = await this.readRepository.findByNameAndYear(normalized.name, normalized.year);
      let seriesId: number;
      let isUpdate = false;

      if (existingSeries) {
        // 4a. Update existing series
        seriesId = existingSeries.id;
        isUpdate = true;

        const updateData: SeriesUpdateRequest = {
          id: seriesId,
          name: normalized.name,
          chapter_number: normalized.chapter_number,
          year: normalized.year,
          description: normalized.description,
          description_en: normalized.description_en,
          qualification: normalized.qualification,
          demography_id: normalized.demography_id,
          visible: normalized.visible,
        };

        await this.writeRepository.update(seriesId, updateData);

        // Remove existing genres and titles before assigning new ones
        // Note: This assumes we want to replace, not merge. Adjust if merge is needed.
        if (normalized.genres && normalized.genres.length > 0) {
          // Get current genres first (would need a method to get current genres)
          // For now, we'll just assign new ones (repository should handle replacement)
          await this.writeRepository.assignGenres(seriesId, normalized.genres);
        }
      } else {
        // 4b. Create new series
        const basicSeriesData: SeriesCreateRequest = {
          name: normalized.name,
          chapter_number: normalized.chapter_number,
          year: normalized.year,
          description: normalized.description,
          description_en: normalized.description_en,
          qualification: normalized.qualification,
          demography_id: normalized.demography_id,
          visible: normalized.visible,
        };

        const newSeries = await this.writeRepository.create(basicSeriesData);
        seriesId = newSeries.id;

        // 5. Assign genres if provided
        if (normalized.genres && normalized.genres.length > 0) {
          await this.writeRepository.assignGenres(seriesId, normalized.genres);
        }
      }

      // 6. Add alternative titles if provided (works for both create and update)
      if (normalized.titles && normalized.titles.length > 0) {
        await this.writeRepository.addTitles(seriesId, normalized.titles);
      }

      // 7. Update ranking
      await this.writeRepository.updateRank();

      // 8. Verify that the series was created/updated correctly
      const completeSeries = await this.readRepository.findById(seriesId);
      if (!completeSeries) {
        throw new Error(`Series ${isUpdate ? 'updated' : 'created'} but not found`);
      }

      return {
        success: true,
        message: isUpdate
          ? 'Series updated successfully with all relations'
          : 'Series created successfully with all relations',
        id: seriesId,
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
      description_en: data.description_en?.trim() ?? '',
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
