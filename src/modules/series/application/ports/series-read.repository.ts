import { SeriesResponse, SeriesSearchFilters, Genre, Demographic } from '../../domain/entities/series.entity';
import Year from '../../domain/entities/year.entity';

/**
 * Repositorio de LECTURA
 * Solo operaciones que leen datos
 * Usa vistas optimizadas
 */
export interface SeriesReadRepository {
  // Queries individuales
  findById(id: number): Promise<SeriesResponse | null>;
  findAll(
    limit: number,
    offset: number
  ): Promise<{
    series: SeriesResponse[];
    total: number;
  }>;

  // Búsquedas
  search(filters: SeriesSearchFilters): Promise<SeriesResponse[]>;
  getProductions(filters: any): Promise<SeriesResponse[]>;

  // Catálogos (lectura pura)
  getGenres(): Promise<Genre[]>;
  getDemographics(): Promise<Demographic[]>;
  getProductionYears(): Promise<Year[]>;
}
