import { QueryHandler } from '../../common/query.interface';
import { GetAllSeriesQuery, GetAllSeriesResponse } from '../../queries/get-all-series.query';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class GetAllSeriesHandler implements QueryHandler<GetAllSeriesQuery, GetAllSeriesResponse> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetAllSeriesQuery): Promise<GetAllSeriesResponse> {
    // Normalizar parámetros
    const limit = this.validateAndNormalizeLimit(query.limit);
    const offset = this.validateAndNormalizeOffset(query.offset);

    // Obtener datos usando vista optimizada
    const result = await this.readRepository.findAll(limit, offset);

    return {
      series: result.series,
      pagination: {
        limit,
        offset,
        total: result.total,
      },
    };
  }

  private validateAndNormalizeLimit(limit: number): number {
    if (limit <= 0) return 50;
    if (limit > 100) return 100;
    return limit;
  }

  private validateAndNormalizeOffset(offset: number): number {
    return offset >= 0 ? offset : 0;
  }
}
