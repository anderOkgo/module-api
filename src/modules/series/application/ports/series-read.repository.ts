import { SeriesResponse, SeriesSearchFilters, Genre, Demographic } from '../../domain/entities/series.entity';
import Year from '../../domain/entities/year.entity';

/**
 * READ Repository
 * Only operations that read data
 * Uses optimized views
 */
export interface SeriesReadRepository {
  // Individual queries
  findById(id: number): Promise<SeriesResponse | null>;
  findAll(
    limit: number,
    offset: number
  ): Promise<{
    series: SeriesResponse[];
    total: number;
  }>;

  // Searches
  search(filters: SeriesSearchFilters): Promise<SeriesResponse[]>;
  getProductions(filters: any): Promise<any[]>; // Returns legacy format for frontend compatibility

  // Catalogs (pure read)
  getGenres(): Promise<Genre[]>;
  getDemographics(): Promise<Demographic[]>;
  getProductionYears(): Promise<Year[]>;
}
