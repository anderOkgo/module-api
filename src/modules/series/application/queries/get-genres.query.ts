import { Query } from '../common/query.interface';
import { Genre } from '../../domain/entities/series.entity';

export interface GetGenresResponse {
  genres: Genre[];
  total: number;
}

export class GetGenresQuery implements Query<GetGenresResponse> {
  readonly cacheKey: string;

  constructor() {
    this.cacheKey = 'series:genres:all';
  }
}
