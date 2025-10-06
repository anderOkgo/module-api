/**
 * Main Series entity
 * Represents a production (anime/manga) in the system
 */
export default interface Series {
  id: number;
  name: string;
  chapter_numer: number; // Keep DB column name
  year: number;
  description: string;
  description_en: string;
  qualification: number;
  demography_id: number;
  demographic_name?: string; // From JOIN
  visible: boolean;
  image?: string;
  rank?: number;
  created_at?: Date;
  updated_at?: Date;
}

/**
 * DTO for series creation
 */
export interface SeriesCreateRequest {
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  description_en: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
}

/**
 * DTO for series update
 */
export interface SeriesUpdateRequest {
  id: number;
  name?: string;
  chapter_number?: number;
  year?: number;
  description?: string;
  description_en?: string;
  qualification?: number;
  demography_id?: number;
  visible?: boolean;
}

/**
 * DTO for series response
 */
export interface SeriesResponse {
  id: number;
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  description_en: string;
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
 * DTO for series search/filtering
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
 * Entity for genres
 */
export interface Genre {
  id: number;
  name: string;
  slug?: string;
}

/**
 * Entity for alternative titles
 */
export interface Title {
  id: number;
  production_id: number;
  name: string;
}

/**
 * Entity for demographics
 */
export interface Demographic {
  id: number;
  name: string;
  slug?: string;
}
