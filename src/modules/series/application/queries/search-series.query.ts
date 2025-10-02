import { Query } from '../common/query.interface';
import { SeriesSearchFilters, SeriesResponse } from '../../domain/entities/series.entity';

export class SearchSeriesQuery implements Query<SeriesResponse[]> {
  readonly cacheKey?: string;

  constructor(public readonly filters: SeriesSearchFilters) {
    // Cache key basado en filtros
    this.cacheKey = `series:search:${JSON.stringify(filters)}`;
  }
}
