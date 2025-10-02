import { Query } from '../common/query.interface';
import Year from '../../domain/entities/year.entity';

export interface GetProductionYearsResponse {
  years: Year[];
  total: number;
}

export class GetProductionYearsQuery implements Query<GetProductionYearsResponse> {
  readonly cacheKey: string;

  constructor() {
    this.cacheKey = 'series:years:all';
  }
}
