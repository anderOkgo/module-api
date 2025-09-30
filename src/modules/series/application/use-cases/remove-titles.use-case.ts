import { ProductionRepository } from '../ports/series.repository';

export class RemoveTitlesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, titleIds: number[]): Promise<boolean> {
    try {
      const result = await this.repository.removeTitles(seriesId, titleIds);
      return result;
    } catch (error) {
      throw new Error(`Error removing titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
