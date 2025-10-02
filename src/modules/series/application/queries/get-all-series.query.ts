import { Query } from '../common/query.interface';
import { SeriesResponse } from '../../domain/entities/series.entity';

export interface GetAllSeriesResponse {
  series: SeriesResponse[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export class GetAllSeriesQuery implements Query<GetAllSeriesResponse> {
  readonly cacheKey: string;

  constructor(public readonly limit: number = 50, public readonly offset: number = 0) {
    this.cacheKey = `series:all:${limit}:${offset}`;
  }
}
