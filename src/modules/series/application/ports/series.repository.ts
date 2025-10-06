import Serie, {
  SeriesCreateRequest,
  SeriesUpdateRequest,
  SeriesSearchFilters,
  Genre,
  Demographic,
} from '../../domain/entities/series.entity';
import Year from '../../domain/entities/year.entity';

/**
 * Series repository port
 * Defines the contract for series data access
 */
export interface ProductionRepository {
  // ==================== CRUD METHODS ====================
  create(series: SeriesCreateRequest): Promise<Serie>;
  findById(id: number): Promise<Serie | null>;
  findAll(limit?: number, offset?: number): Promise<Serie[]>;
  update(id: number, series: SeriesUpdateRequest): Promise<Serie>;
  delete(id: number): Promise<boolean>;

  // ==================== SEARCH METHODS ====================
  search(filters: SeriesSearchFilters): Promise<Serie[]>;
  getProduction(production: Serie): Promise<Serie[]>;

  // ==================== IMAGE METHODS ====================
  updateImage(id: number, imagePath: string): Promise<boolean>;

  // ==================== RELATIONSHIP METHODS ====================
  assignGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  removeGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  addTitles(seriesId: number, titles: string[]): Promise<boolean>;
  removeTitles(seriesId: number, titleIds: number[]): Promise<boolean>;

  // ==================== CATALOG METHODS ====================
  getGenres(): Promise<Genre[]>;
  getDemographics(): Promise<Demographic[]>;
  getProductionYears(): Promise<Year[]>;

  // ==================== MAINTENANCE METHODS ====================
  updateRank(): Promise<void>;
}
