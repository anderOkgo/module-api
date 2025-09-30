import Serie, { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';
import Year from '../../domain/entities/year.entity';

export interface ProductionRepository {
  getProduction(production: Serie): Promise<Serie | any>;
  getProductionYears(): Promise<Year | any>;
  // Métodos CRUD
  create(series: SeriesCreateRequest): Promise<Serie>;
  findById(id: number): Promise<Serie | null>;
  findAll(limit?: number, offset?: number): Promise<Serie[]>;
  update(id: number, series: SeriesUpdateRequest): Promise<Serie>;
  delete(id: number): Promise<boolean>;
  updateImage(id: number, imagePath: string): Promise<boolean>;
  search(filters: Partial<Serie>): Promise<Serie[]>;
  // Métodos para relaciones
  assignGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  removeGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  addTitles(seriesId: number, titles: string[]): Promise<boolean>;
  removeTitles(seriesId: number, titleIds: number[]): Promise<boolean>;
  // Métodos para obtener catálogos
  getGenres(): Promise<any[]>;
  getDemographics(): Promise<any[]>;
}
