import { QueryHandler } from '../../common/query.interface';
import { GetProductionsQuery } from '../../queries/get-productions.query';
import { SeriesReadRepository } from '../../ports/series-read.repository';

/**
 * Handler para obtener producciones con filtros complejos
 * Utiliza la vista completa con filtros dinámicos
 * // Validated under FULLTEST
 */
export class GetProductionsHandler implements QueryHandler<GetProductionsQuery, any[]> {
  constructor(private readonly readRepository: SeriesReadRepository) {}

  async execute(query: GetProductionsQuery): Promise<any[]> {
    try {
      const { filters } = query;

      // 1. Validar entrada
      this.validateFilters(filters);

      // 2. Obtener producciones
      const productions = await this.readRepository.getProductions(filters);

      return productions;
    } catch (error) {
      throw new Error(`Error getting productions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateFilters(filters: any): void {
    // Validaciones básicas para evitar queries peligrosas
    if (filters && typeof filters !== 'object') {
      throw new Error('Filters must be an object');
    }

    // Validar límite si se proporciona
    if (filters.limit !== undefined) {
      const limit = parseInt(filters.limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }
    }

    // Validar offset si se proporciona
    if (filters.offset !== undefined) {
      const offset = parseInt(filters.offset, 10);
      if (isNaN(offset) || offset < 0) {
        throw new Error('Offset must be a non-negative number');
      }
    }
  }
}
