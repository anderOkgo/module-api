import { ProductionRepository } from '../ports/series.repository';

export class SearchSeriesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(filters: any): Promise<any> {
    try {
      const series = await this.repository.search(filters);
      return series;
    } catch (error) {
      throw new Error(`Error searching series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
