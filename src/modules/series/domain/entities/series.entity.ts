/**
 * Entidad principal de Series
 * Representa una producción (anime/manga) en el sistema
 */
export default interface Series {
  id: number;
  name: string;
  chapter_numer: number; // Mantener nombre de columna DB
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  demographic_name?: string; // Del JOIN
  visible: boolean;
  image?: string;
  rank?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * DTO para creación de series
 */
export interface SeriesCreateRequest {
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
}

/**
 * DTO para actualización de series
 */
export interface SeriesUpdateRequest {
  id: number;
  name?: string;
  chapter_number?: number;
  year?: number;
  description?: string;
  qualification?: number;
  demography_id?: number;
  visible?: boolean;
}

/**
 * DTO para respuesta de series
 */
export interface SeriesResponse {
  id: number;
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  demographic_name?: string;
  visible: boolean;
  image?: string;
  rank?: number;
  genres?: Genre[];
  titles?: Title[];
}

/**
 * DTO para búsqueda/filtrado de series
 */
export interface SeriesSearchFilters {
  name?: string;
  year?: number;
  demography_id?: number;
  visible?: boolean;
  genre_ids?: number[];
  limit?: number;
  offset?: number;
}

/**
 * Entidad para géneros
 */
export interface Genre {
  id: number;
  name: string;
  slug?: string;
}

/**
 * Entidad para títulos alternativos
 */
export interface Title {
  id: number;
  production_id: number;
  name: string;
}

/**
 * Entidad para demografías
 */
export interface Demographic {
  id: number;
  name: string;
  slug?: string;
}
