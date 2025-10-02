import { ProductionRepository } from '../ports/series.repository';

/**
 * Caso de uso para remover títulos alternativos de una serie
 * Valida y orquesta la remoción de títulos
 */
export class RemoveTitlesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, titleIds: number[]): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar entrada
      this.validateInput(seriesId, titleIds);

      // 2. Verificar que la serie existe
      const series = await this.repository.findById(seriesId);
      if (!series) {
        return { success: false, message: 'Series not found' };
      }

      // 3. Normalizar IDs (eliminar duplicados)
      const uniqueTitleIds = [...new Set(titleIds)];

      // 4. Remover títulos
      const result = await this.repository.removeTitles(seriesId, uniqueTitleIds);

      return {
        success: result,
        message: result ? 'Titles removed successfully' : 'No titles were removed',
      };
    } catch (error) {
      throw new Error(`Error removing titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(seriesId: number, titleIds: number[]): void {
    if (!seriesId || seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(titleIds)) {
      throw new Error('Title IDs must be an array');
    }

    if (titleIds.length === 0) {
      throw new Error('At least one title ID is required');
    }

    if (titleIds.some((id) => !Number.isInteger(id) || id <= 0)) {
      throw new Error('All title IDs must be positive integers');
    }
  }
}
