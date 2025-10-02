/**
 * Interfaz base para Queries
 * Las queries solo leen datos, no modifican estado
 */
export interface Query<TResult> {
  readonly cacheKey?: string;
}

export interface QueryHandler<TQuery extends Query<TResult>, TResult> {
  execute(query: TQuery): Promise<TResult>;
}
