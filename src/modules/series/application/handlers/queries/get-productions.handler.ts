import { QueryHandler } from '../../common/query.interface';
import { GetProductionsQuery } from '../../queries/get-productions.query';
import { SeriesReadRepository } from '../../ports/series-read.repository';

/**
 * Handler to get productions with complex filters
 * Uses complete view with dynamic filters
 * // Validated under FULLTEST
 */
export class GetProductionsHandler implements QueryHandler<GetProductionsQuery, any[]> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetProductionsQuery): Promise<any[]> {
    try {
      const { filters } = query;

      // 1. Validate input
      this.validateFilters(filters);

      // 2. Get productions
      const productions = await this.readRepository.getProductions(filters);

      return productions;
    } catch (error) {
      throw new Error(`Error getting productions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateFilters(filters: any): void {
    // Basic validations to avoid dangerous queries
    if (filters && typeof filters !== 'object') {
      throw new Error('Filters must be an object');
    }

    // Set default limit if not provided
    if (filters.limit === undefined) {
      filters.limit = 500; // Default value for frontend
    }

    // Validate limit (now always exists)
    const limit = parseInt(filters.limit, 10);
    if (isNaN(limit) || limit < 1 || limit > 10000) {
      throw new Error(`Limit must be between 1 and 10000. Received: ${filters.limit}, parsed: ${limit}`);
    }

    // Validate offset if provided
    if (filters.offset !== undefined) {
      const offset = parseInt(filters.offset, 10);
      if (isNaN(offset) || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }

    // Validate production_ranking_number to prevent SQL injection
    if (filters.production_ranking_number !== undefined) {
      const validDirections = ['ASC', 'DESC'];
      const direction = filters.production_ranking_number?.toString().toUpperCase();
      if (!validDirections.includes(direction)) {
        throw new Error(`Invalid sorting direction: ${filters.production_ranking_number}. Must be ASC or DESC.`);
      }
      // Normalize to uppercase for consistency
      filters.production_ranking_number = direction;
    }
  }
}
