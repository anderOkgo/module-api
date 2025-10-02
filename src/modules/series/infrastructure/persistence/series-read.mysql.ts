import { Database, HDB } from '../../../../infrastructure/my.database.helper';
import { SeriesReadRepository } from '../../application/ports/series-read.repository';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class SeriesReadMysqlRepository implements SeriesReadRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  /**
   * Obtiene una serie por ID
   * TODO: Optimizar con vista que incluya géneros y títulos en JSON
   */
  async findById(id: number): Promise<SeriesResponse | null> {
    const query = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      WHERE p.id = ?
    `;
    const result = await this.database.executeSafeQuery(query, [id]);

    if (result.errorSys || result.length === 0) {
      return null;
    }

    return this.mapToResponse(result[0]);
  }

  /**
   * Lista todas las series con paginación
   */
  async findAll(
    limit: number,
    offset: number
  ): Promise<{
    series: SeriesResponse[];
    total: number;
  }> {
    // Query para datos
    const dataQuery = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      ORDER BY p.rank ASC, p.qualification DESC
      LIMIT ? OFFSET ?
    `;

    // Query para total
    const countQuery = 'SELECT COUNT(*) as total FROM productions';

    const [dataResult, countResult] = await Promise.all([
      this.database.executeSafeQuery(dataQuery, [limit, offset]),
      this.database.executeSafeQuery(countQuery, []),
    ]);

    if (dataResult.errorSys) {
      throw new Error(dataResult.message);
    }

    return {
      series: dataResult.map((row: any) => this.mapToResponse(row)),
      total: countResult[0]?.total || 0,
    };
  }

  /**
   * Búsqueda con filtros
   */
  async search(filters: any): Promise<SeriesResponse[]> {
    let query = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.name) {
      query += ' AND p.name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.year) {
      query += ' AND p.year = ?';
      params.push(filters.year);
    }
    if (filters.demography_id) {
      query += ' AND p.demography_id = ?';
      params.push(filters.demography_id);
    }
    if (filters.visible !== undefined) {
      query += ' AND p.visible = ?';
      params.push(filters.visible);
    }

    query += ' ORDER BY p.rank ASC, p.qualification DESC LIMIT ? OFFSET ?';
    params.push(filters.limit || 50, filters.offset || 0);

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result.map((row: any) => this.mapToResponse(row));
  }

  /**
   * Obtiene catálogo de géneros
   */
  async getGenres(): Promise<any[]> {
    const query = 'SELECT id, name, slug FROM genres ORDER BY name ASC';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result;
  }

  /**
   * Obtiene catálogo de demografías
   */
  async getDemographics(): Promise<any[]> {
    const query = 'SELECT id, name, slug FROM demographics ORDER BY name ASC';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result;
  }

  /**
   * Obtiene años de producción disponibles
   */
  async getProductionYears(): Promise<any[]> {
    const query = 'SELECT * FROM view_all_years_productions';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result;
  }

  /**
   * Obtiene producciones (transplantado del repositorio legacy)
   * Usa la vista view_all_info_produtions con la misma lógica exacta
   */
  async getProductions(filters: any): Promise<any[]> {
    // Transplantado del repositorio legacy - usa la misma lógica exacta
    const viewName = 'view_all_info_produtions';
    const initialQuery = `SELECT * FROM ${viewName} WHERE 1`;
    const conditions: string[] = [];
    const conditionsVals: any[] = [];

    // Mapeo de condiciones (transplantado del legacy)
    const conditionMap: Record<string, (label: string, value: any) => string> = {
      production_name: HDB.generateLikeCondition,
      production_number_chapters: HDB.generateBetweenCondition,
      production_description: HDB.generateLikeCondition,
      production_year: HDB.generateBetweenCondition,
      demographic_name: HDB.generateEqualCondition,
      genre_names: HDB.generateAndCondition,
      id: HDB.generateInCondition,
    };

    // Aplicar filtros usando la misma lógica del legacy
    for (const [key, value] of Object.entries(filters)) {
      if (conditionMap[key]) {
        conditions.push(conditionMap[key](key, value));
        conditionsVals.push(value);
      }
    }

    // Agregar ordenamiento y límite (transplantado del legacy)
    conditions.push(HDB.generateOrderBy('production_ranking_number', 'ASC'));
    conditions.push(HDB.generateLimit());
    const fullQuery = `${initialQuery} ${conditions.join(' ')}`;

    // Normalizar limit si existe (transplantado del legacy)
    const limit = filters.limit;
    if (limit) {
      conditionsVals.push(parseInt(limit));
    }

    // Merge de arrays (transplantado del legacy)
    const mergedArray: any[] = [];
    conditionsVals.forEach((element) => {
      if (Array.isArray(element)) {
        mergedArray.push(...element);
      } else {
        mergedArray.push(element);
      }
    });

    const result = await this.database.executeSafeQuery(fullQuery, mergedArray);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result;
  }

  private mapToResponse(row: any): SeriesResponse {
    return {
      id: row.id,
      name: row.name,
      chapter_number: row.chapter_numer,
      year: row.year,
      description: row.description,
      qualification: row.qualification,
      demography_id: row.demography_id,
      demographic_name: row.demographic_name,
      visible: row.visible,
      image: row.image,
      rank: row.rank,
    };
  }
}
