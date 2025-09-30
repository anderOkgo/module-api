import { ProductionRepository } from '../ports/series.repository';
import { SeriesUpdateRequest } from '../../domain/entities/series.entity';

export class UpdateSeriesUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(id: number, seriesData: SeriesUpdateRequest): Promise<any> {
    try {
      const updatedSeries = await this.repository.update(id, seriesData);
      return updatedSeries;
    } catch (error) {
      throw new Error(`Error updating series: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
