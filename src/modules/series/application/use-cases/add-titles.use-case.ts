import { ProductionRepository } from '../ports/series.repository';

/**
 * Caso de uso para agregar títulos alternativos a una serie
 * Valida, normaliza y orquesta la adición de títulos
 */
export class AddTitlesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, titles: string[]): Promise<{ success: boolean; message: string }> {
    try {
      // 1. Validar entrada
      this.validateInput(seriesId, titles);

      // 2. Verificar que la serie existe
      const series = await this.repository.findById(seriesId);
      if (!series) {
        return { success: false, message: 'Series not found' };
      }

      // 3. Normalizar títulos
      const normalizedTitles = this.normalizeTitles(titles);

      if (normalizedTitles.length === 0) {
        return { success: false, message: 'No valid titles to add' };
      }

      // 4. Agregar títulos
      const result = await this.repository.addTitles(seriesId, normalizedTitles);

      return {
        success: result,
        message: result ? 'Titles added successfully' : 'Failed to add titles',
      };
    } catch (error) {
      throw new Error(`Error adding titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(seriesId: number, titles: string[]): void {
    if (!seriesId || seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(titles)) {
      throw new Error('Titles must be an array');
    }

    if (titles.length === 0) {
      throw new Error('At least one title is required');
    }

    if (titles.length > 100) {
      throw new Error('Maximum 100 titles can be added at once');
    }

    if (titles.some((title) => typeof title !== 'string')) {
      throw new Error('All titles must be strings');
    }
  }

  private normalizeTitles(titles: string[]): string[] {
    return titles
      .map((title) => title.trim())
      .filter((title) => title.length > 0)
      .filter((title, index, self) => self.indexOf(title) === index); // Remove duplicates
  }
}
