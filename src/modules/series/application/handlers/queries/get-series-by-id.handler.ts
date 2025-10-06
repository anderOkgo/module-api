import { QueryHandler } from '../../common/query.interface';
import { GetSeriesByIdQuery } from '../../queries/get-series-by-id.query';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class GetSeriesByIdHandler implements QueryHandler<GetSeriesByIdQuery, SeriesResponse | null> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetSeriesByIdQuery): Promise<SeriesResponse | null> {
    // Minimal validation
    if (!query.id || query.id <= 0) {
      throw new Error('Valid series ID is required');
    }

    // Simple read, without complex business logic
    // Repository uses an optimized view
    return await this.readRepository.findById(query.id);
  }
}
