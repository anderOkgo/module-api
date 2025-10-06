import { CommandHandler } from '../../common/command.interface';
import { RemoveGenresCommand } from '../../commands/remove-genres.command';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class RemoveGenresHandler
  implements CommandHandler<RemoveGenresCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(command: RemoveGenresCommand): Promise<{ success: boolean; message: string }> {
    // 1. Validate input
    this.validateInput(command);

    // 2. Verify that the series exists
    const series = await this.readRepository.findById(command.seriesId);
    if (!series) {
      throw new Error('Series not found');
    }

    // 3. Normalize IDs (remove duplicates)
    const uniqueGenreIds = [...new Set(command.genreIds)];

    // 4. Remove genres
    await this.writeRepository.removeGenres(command.seriesId, uniqueGenreIds);

    return {
      success: true,
      message: `Genres removed successfully from series ${command.seriesId}`,
    };
  }

  private validateInput(command: RemoveGenresCommand): void {
    if (!command.seriesId || command.seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(command.genreIds) || command.genreIds.length === 0) {
      throw new Error('At least one genre ID is required');
    }

    // Validate that all are positive numbers
    const invalidIds = command.genreIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new Error(`Invalid genre IDs: ${invalidIds.join(', ')}`);
    }
  }
}
