import { CommandHandler } from '../../common/command.interface';
import { RemoveTitlesCommand } from '../../commands/remove-titles.command';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class RemoveTitlesHandler
  implements CommandHandler<RemoveTitlesCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(command: RemoveTitlesCommand): Promise<{ success: boolean; message: string }> {
    // 1. Validate input
    this.validateInput(command);

    // 2. Verify that the series exists
    const series = await this.readRepository.findById(command.seriesId);
    if (!series) {
      throw new Error('Series not found');
    }

    // 3. Normalize IDs (remove duplicates)
    const uniqueTitleIds = [...new Set(command.titleIds)];

    // 4. Remove titles
    await this.writeRepository.removeTitles(command.seriesId, uniqueTitleIds);

    return {
      success: true,
      message: `Titles removed successfully from series ${command.seriesId}`,
    };
  }

  private validateInput(command: RemoveTitlesCommand): void {
    if (!command.seriesId || command.seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(command.titleIds) || command.titleIds.length === 0) {
      throw new Error('At least one title ID is required');
    }

    // Validate that all are positive numbers
    const invalidIds = command.titleIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new Error(`Invalid title IDs: ${invalidIds.join(', ')}`);
    }
  }
}
