import { ProductionRepository } from '../ports/series.repository';
import Series from '../../domain/entities/series.entity';

/**
 * Caso de uso para obtener producciones con filtros complejos
 * Utiliza la vista completa con filtros dinámicos
 */
export class GetProductionsUseCase {
  constructor(private readonly repository: ProductionRepository) {}

  async execute(filters: Partial<Series>): Promise<Series[]> {
    try {
      // 1. Validar entrada
      this.validateFilters(filters);

      // 2. Obtener producciones
      const productions = await this.repository.getProduction(filters as Series);

      return productions;
    } catch (error) {
      throw new Error(`Error getting productions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateFilters(filters: Partial<Series>): void {
    // Validaciones básicas para evitar queries peligrosas
    if (filters && typeof filters !== 'object') {
      throw new Error('Filters must be an object');
    }

    // Agregar validaciones específicas si es necesario
    if ((filters as any).limit) {
      const limit = parseInt((filters as any).limit, 10);
      if (isNaN(limit) || limit < 1 || limit > 1000) {
        throw new Error('Limit must be between 1 and 1000');
      }
    }
  }
}
