import { ProductionRepository } from '../ports/series.repository';

export class AssignGenresUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, genreIds: number[]): Promise<boolean> {
    try {
      const result = await this.repository.assignGenres(seriesId, genreIds);
      return result;
    } catch (error) {
      throw new Error(`Error assigning genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
