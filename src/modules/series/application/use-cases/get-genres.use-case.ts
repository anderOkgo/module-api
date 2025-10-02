import { ProductionRepository } from '../ports/series.repository';
import { Genre } from '../../domain/entities/series.entity';

/**
 * Caso de uso para obtener todos los géneros disponibles
 * Utilizado para catálogos y filtros
 */
export class GetGenresUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(): Promise<{ genres: Genre[]; total: number }> {
    try {
      // Obtener géneros
      const genres = await this.repository.getGenres();

      return {
        genres,
        total: genres.length,
      };
    } catch (error) {
      throw new Error(`Error getting genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
