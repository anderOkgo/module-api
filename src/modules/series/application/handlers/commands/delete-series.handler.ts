import { CommandHandler } from '../../common/command.interface';
import { DeleteSeriesCommand } from '../../commands/delete-series.command';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';
import { ImageService } from '../../services/image.service';

export class DeleteSeriesHandler
  implements CommandHandler<DeleteSeriesCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository,
    private readonly imageService: ImageService
  ) {}

  async execute(command: DeleteSeriesCommand): Promise<{ success: boolean; message: string }> {
    // 1. Validar
    if (!command.id || command.id <= 0) {
      throw new Error('Valid series ID is required');
    }

    // 2. Verificar que existe
    const series = await this.readRepository.findById(command.id);
    if (!series) {
      return { success: false, message: 'Series not found' };
    }

    // 3. Eliminar imagen del filesystem
    if (series.image && series.image.trim() !== '') {
      try {
        await this.imageService.deleteImage(series.image);
      } catch (error) {
        console.warn(`Could not delete image for series ${command.id}:`, error);
      }
    }

    // 4. Eliminar de BD
    const deleted = await this.writeRepository.delete(command.id);

    if (!deleted) {
      return { success: false, message: 'Failed to delete series' };
    }

    return { success: true, message: 'Series deleted successfully' };
  }
}
