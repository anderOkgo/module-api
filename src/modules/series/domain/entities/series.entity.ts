export default interface Series {
  id: any;
  production_name: string;
  production_number_chapters: number[];
  production_description: string;
  production_year: number[];
  demographic_name: string;
  genre_names: string[];
  limit: string;
  // Campos adicionales para CRUD
  image?: string;
  qualification?: number;
  demography_id?: number;
  visible?: boolean;
  rank?: number;
  created_at?: Date;
  updated_at?: Date;
}

// Interfaces para operaciones CRUD
export interface SeriesCreateRequest {
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
}

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
