import { QueryHandler } from '../../common/query.interface';
import { SearchSeriesQuery } from '../../queries/search-series.query';
import { SeriesResponse } from '../../../domain/entities/series.entity';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class SearchSeriesHandler implements QueryHandler<SearchSeriesQuery, SeriesResponse[]> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: SearchSeriesQuery): Promise<SeriesResponse[]> {
    // Normalizar filtros
    const normalizedFilters = this.normalizeFilters(query.filters);

    // Buscar usando vista optimizada
    return await this.readRepository.search(normalizedFilters);
  }

  private normalizeFilters(filters: any) {
    return {
      ...filters,
      limit: filters.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 50,
      offset: filters.offset && filters.offset >= 0 ? filters.offset : 0,
    };
  }
}
