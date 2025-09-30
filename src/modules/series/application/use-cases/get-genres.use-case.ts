import { ProductionRepository } from '../ports/series.repository';

export class GetGenresUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(): Promise<any> {
    try {
      const genres = await this.repository.getGenres();
      return genres;
    } catch (error) {
      throw new Error(`Error getting genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
