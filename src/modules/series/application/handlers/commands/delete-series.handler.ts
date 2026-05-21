import { CommandHandler } from '../../common/command.interface';
import { DeleteSeriesCommand } from '../../commands/delete-series.command';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class DeleteSeriesHandler
  implements CommandHandler<DeleteSeriesCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(command: DeleteSeriesCommand): Promise<{ success: boolean; message: string }> {
    // 1. Validate
    if (!command.id || command.id <= 0) {
      throw new Error('Valid series ID is required');
    }

    // 2. Verify that it exists
    const series = await this.readRepository.findById(command.id);
    if (!series) {
      return { success: false, message: 'Series not found' };
    }

    // 3. Already hidden (idempotent delete)
    if (!series.visible) {
      return { success: true, message: 'Series deleted successfully' };
    }

    // 4. Soft delete: set visible = false (keeps row and image)
    const deleted = await this.writeRepository.delete(command.id);

    if (!deleted) {
      return { success: false, message: 'Failed to delete series' };
    }

    return { success: true, message: 'Series deleted successfully' };
  }
}
