import { ProductionRepository } from '../ports/series.repository';

/**
 * Caso de uso para remover géneros de una serie
 * Valida y orquesta la remoción de géneros
 */
export class RemoveGenresUseCase {
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

      // 4. Remover géneros
      const result = await this.repository.removeGenres(seriesId, uniqueGenreIds);

      return {
        success: result,
        message: result ? 'Genres removed successfully' : 'No genres were removed',
      };
    } catch (error) {
      throw new Error(`Error removing genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(seriesId: number, genreIds: number[]): void {
    if (!seriesId || seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(genreIds)) {
      throw new Error('Genre IDs must be an array');
    }

    if (genreIds.length === 0) {
      throw new Error('At least one genre ID is required');
    }

    if (genreIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error('All genre IDs must be positive integers');
    }
  }
}
