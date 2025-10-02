import { CommandHandler } from '../../common/command.interface';
import { AssignGenresCommand } from '../../commands/assign-genres.command';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class AssignGenresHandler
  implements CommandHandler<AssignGenresCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(command: AssignGenresCommand): Promise<{ success: boolean; message: string }> {
    // 1. Validar entrada
    this.validateInput(command);

    // 2. Verificar que la serie existe
    const series = await this.readRepository.findById(command.seriesId);
    if (!series) {
      throw new Error('Series not found');
    }

    // 3. Normalizar IDs (eliminar duplicados)
    const uniqueGenreIds = [...new Set(command.genreIds)];

    // 4. Asignar géneros
    await this.writeRepository.assignGenres(command.seriesId, uniqueGenreIds);

    return {
      success: true,
      message: `Genres assigned successfully to series ${command.seriesId}`,
    };
  }

  private validateInput(command: AssignGenresCommand): void {
    if (!command.seriesId || command.seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(command.genreIds) || command.genreIds.length === 0) {
      throw new Error('At least one genre ID is required');
    }

    // Validar que todos sean números positivos
    const invalidIds = command.genreIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new Error(`Invalid genre IDs: ${invalidIds.join(', ')}`);
    }
  }
}
