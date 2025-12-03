import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

/**
 * WRITE Repository
 * Only operations that modify state
 */
export interface SeriesWriteRepository {
  // CRUD
  create(series: SeriesCreateRequest): Promise<{ id: number; [key: string]: any }>;
  update(id: number, series: SeriesUpdateRequest): Promise<void>;
  delete(id: number): Promise<boolean>;

  // Image
  updateImage(id: number, imagePath: string): Promise<boolean>;

  // Relationships
  assignGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  removeGenres(seriesId: number, genreIds: number[]): Promise<boolean>;
  addTitles(seriesId: number, titles: string[]): Promise<boolean>;
  removeTitles(seriesId: number, titleIds: number[]): Promise<boolean>;

  // Maintenance
  updateRank(): Promise<void>;
}
