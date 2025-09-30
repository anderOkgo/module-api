import { ProductionRepository } from '../ports/series.repository';

export class GetAllSeriesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const series = await this.repository.findAll(limit, offset);
      return series;
    } catch (error) {
      throw new Error(`Error getting all series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
