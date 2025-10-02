import { Query } from '../common/query.interface';
import { Demographic } from '../../domain/entities/series.entity';

export interface GetDemographicsResponse {
  demographics: Demographic[];
  total: number;
}

export class GetDemographicsQuery implements Query<GetDemographicsResponse> {
  readonly cacheKey: string;

  constructor() {
    this.cacheKey = 'series:demographics:all';
  }
}
