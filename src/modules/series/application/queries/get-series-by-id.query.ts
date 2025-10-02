import { Query } from '../common/query.interface';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class GetSeriesByIdQuery implements Query<SeriesResponse | null> {
  readonly cacheKey: string;

  constructor(public readonly id: number) {
    this.cacheKey = `series:${id}`;
  }
}
