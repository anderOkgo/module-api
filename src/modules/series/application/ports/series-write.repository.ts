import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

/**
 * Repositorio de ESCRITURA
 * Solo operaciones que modifican el estado
 */
export interface SeriesWriteRepository {
  // CRUD
  create(series: SeriesCreateRequest): Promise<{ id: number; [key: string]: any }>;
  update(id: number, series: SeriesUpdateRequest): Promise<void>;
  delete(id: number): Promise<boolean>;

  // Imagen
  updateImage(id: number, imagePath: string): Promise<boolean>;

  // Relaciones
  assignGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  removeGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  addTitles(seriesId: number, titles: string[]): Promise<boolean>;
  removeTitles(seriesId: number, titleIds: number[]): Promise<boolean>;

  // Mantenimiento
  updateRank(): Promise<void>;
}
