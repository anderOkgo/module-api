import { ProductionRepository } from '../ports/series.repository';

/**
 * Caso de uso para asignar géneros a una serie
 * Valida y orquesta la asignación de géneros
 */
export class AssignGenresUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, genreIds: number[]): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar entrada
      this.validateInput(seriesId, genreIds);

      // 2. Verificar que la serie existe
      const series = await this.repository.findById(seriesId);
      if (!series) {
        return { success: false, message: 'Series not found' };
      }

      // 3. Normalizar IDs (eliminar duplicados)
      const uniqueGenreIds = [...new Set(genreIds)];

      // 4. Asignar géneros
      const result = await this.repository.assignGenres(seriesId, uniqueGenreIds);

      return {
        success: result,
        message: result ? 'Genres assigned successfully' : 'Failed to assign genres',
      };
    } catch (error) {
      throw new Error(`Error assigning genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(seriesId: number, genreIds: number[]): void {
    if (!seriesId || seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(genreIds)) {
      throw new Error('Genre IDs must be an array');
    }

    if (genreIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error('All genre IDs must be positive integers');
    }

    if (genreIds.length > 50) {
      throw new Error('Maximum 50 genres can be assigned at once');
    }
  }
}
