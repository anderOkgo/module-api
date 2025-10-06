/**
 * Base interface for Queries
 * Queries only read data, they do not modify state
 */
export interface Query<TResult> {
  readonly cacheKey?: string;
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult>;
}
