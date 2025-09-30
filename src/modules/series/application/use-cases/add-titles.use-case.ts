import { ProductionRepository } from '../ports/series.repository';

export class AddTitlesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(seriesId: number, titles: string[]): Promise<boolean> {
    try {
      const result = await this.repository.addTitles(seriesId, titles);
      return result;
    } catch (error) {
      throw new Error(`Error adding titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
