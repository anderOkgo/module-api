import { ProductionRepository } from '../ports/series.repository';

export class RemoveGenresUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, genreIds: number[]): Promise<boolean> {
    try {
      const result = await this.repository.removeGenres(seriesId, genreIds);
      return result;
    } catch (error) {
      throw new Error(`Error removing genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
