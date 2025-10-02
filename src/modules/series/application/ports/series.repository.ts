import Serie, {
  SeriesCreateRequest,
  SeriesUpdateRequest,
  SeriesSearchFilters,
  Genre,
  Demographic,
} from '../../domain/entities/series.entity';
import Year from '../../domain/entities/year.entity';

/**
 * Puerto del repositorio de Series
 * Define el contrato para acceso a datos de series
 */
export interface ProductionRepository {
  // ==================== MÉTODOS CRUD ====================
  create(series: SeriesCreateRequest): Promise<Serie>;
  findById(id: number): Promise<Serie | null>;
  findAll(limit?: number, offset?: number): Promise<Serie[]>;
  update(id: number, series: SeriesUpdateRequest): Promise<Serie>;
  delete(id: number): Promise<boolean>;

  // ==================== MÉTODOS DE BÚSQUEDA ====================
  search(filters: SeriesSearchFilters): Promise<Serie[]>;
  getProduction(production: Serie): Promise<Serie[]>;

  // ==================== MÉTODOS DE IMAGEN ====================
  updateImage(id: number, imagePath: string): Promise<boolean>;

  // ==================== MÉTODOS DE RELACIONES ====================
  assignGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  removeGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  addTitles(seriesId: number, titles: string[]): Promise<boolean>;
  removeTitles(seriesId: number, titleIds: number[]): Promise<boolean>;

  // ==================== MÉTODOS DE CATÁLOGOS ====================
  getGenres(): Promise<Genre[]>;
  getDemographics(): Promise<Demographic[]>;
  getProductionYears(): Promise<Year[]>;

  // ==================== MÉTODOS DE MANTENIMIENTO ====================
  updateRank(): Promise<void>;
}
