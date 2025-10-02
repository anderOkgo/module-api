import { Query } from '../common/query.interface';

export interface ProductionFilters {
  type?: string;
  demographic?: string;
  genre?: number;
  state?: string;
  production?: string;
  year?: number;
  limit?: number;
  offset?: number;
}

export class GetProductionsQuery implements Query<any[]> {
  readonly cacheKey?: string;

  constructor(public readonly filters: ProductionFilters) {
    this.cacheKey = `productions:${JSON.stringify(filters)}`;
  }
}
