import Serie, { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/models/Series';
import Year from '../../domain/models/Year';

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
}
