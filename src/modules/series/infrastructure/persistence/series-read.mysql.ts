import { Database, HDB } from '../../../../infrastructure/my.database.helper';
import { SeriesReadRepository } from '../../application/ports/series-read.repository';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class SeriesReadMysqlRepository implements SeriesReadRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  /**
   * Gets a series by ID
   * TODO: Optimize with view that includes genres and titles in JSON
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

    const series = this.mapToResponse(result[0]);

    // Get genres
    const genresQuery = `
      SELECT g.id, g.name, g.slug
      FROM genres g
      INNER JOIN productions_genres pg ON g.id = pg.genre_id
      WHERE pg.production_id = ?
    `;
    const genresResult = await this.database.executeSafeQuery(genresQuery, [id]);
    if (!genresResult.errorSys) {
      series.genres = genresResult;
    }

    // Get titles
    const titlesQuery = `
      SELECT id, production_id, name
      FROM titles
      WHERE production_id = ?
    `;
    const titlesResult = await this.database.executeSafeQuery(titlesQuery, [id]);
    if (!titlesResult.errorSys) {
      series.titles = titlesResult;
    }

    return series;
  }

  /**
   * Finds a series by name and year (for duplicate checking)
   */
  async findByNameAndYear(name: string, year: number): Promise<{ id: number; name: string; year: number } | null> {
    const query = `
      SELECT id, name, year
      FROM productions
      WHERE LOWER(TRIM(name)) = LOWER(TRIM(?)) AND year = ?
      LIMIT 1
    `;
    const result = await this.database.executeSafeQuery(query, [name, year]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result.length > 0 ? result[0] : null;
  }

  /**
   * Lists all series with pagination
   */
  async findAll(
    limit: number,
    offset: number
  ): Promise<{
    series: SeriesResponse[];
    total: number;
  }> {
    // Query for data
    const dataQuery = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      WHERE p.visible = 1
      ORDER BY p.rank ASC, p.qualification DESC
      LIMIT ? OFFSET ?
    `;

    // Query for total
    const countQuery = 'SELECT COUNT(*) as total FROM productions WHERE visible = 1';

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
   * Search with filters
   */
  async search(filters: any): Promise<SeriesResponse[]> {
    let query = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      WHERE p.visible = 1
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
    // Note: visible filter is always 1 for public queries, admin can override if needed

    query += ' ORDER BY p.rank ASC, p.qualification DESC LIMIT ? OFFSET ?';
    params.push(filters.limit || 50, filters.offset || 0);

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return result.map((row: any) => this.mapToResponse(row));
  }

  /**
   * Gets genres catalog
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
   * Gets demographics catalog
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
   * Gets available production years
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
   * Gets productions (transplanted from legacy repository)
   * Uses view_all_info_produtions with the exact same logic
   */
  async getProductions(filters: any): Promise<any[]> {
    // Transplanted from legacy repository - uses the exact same logic
    const viewName = 'view_all_info_produtions';
    const initialQuery = `SELECT * FROM ${viewName} WHERE visible = 1`;
    const conditions: string[] = [];
    const conditionsVals: any[] = [];

    // Condition mapping (transplanted from legacy)
    const conditionMap: Record<string, (label: string, value: any) => string> = {
      production_name: HDB.generateLikeCondition,
      production_number_chapters: HDB.generateBetweenCondition,
      production_description: HDB.generateLikeCondition,
      production_description_en: HDB.generateLikeCondition,
      production_year: HDB.generateBetweenCondition,
      demographic_name: HDB.generateEqualCondition,
      genre_names: HDB.generateAndCondition,
      production_ranking_number: HDB.generateOrderBy,
      id: HDB.generateInCondition,
    };

    // Apply filters using the same legacy logic
    for (const [key, value] of Object.entries(filters)) {
      if (conditionMap[key]) {
        conditions.push(conditionMap[key](key, value));
        // Don't add value for ORDER BY as it doesn't need parameters
        if (key !== 'production_ranking_number') {
          conditionsVals.push(value);
        }
      }
    }

    // Add sorting and limit (transplanted from legacy)
    filters.production_ranking_number ?? conditions.push(HDB.generateOrderBy('id', 'DESC'));
    conditions.push(HDB.generateLimit());
    const fullQuery = `${initialQuery} ${conditions.join(' ')}`;

    // Normalize limit if exists (transplanted from legacy)
    const limit = filters.limit;
    if (limit) {
      conditionsVals.push(parseInt(limit));
    }

    // Array merge (transplanted from legacy)
    const mergedArray: any[] = [];
    conditionsVals.forEach((element) => {
      if (Array.isArray(element)) {
        mergedArray.push(...element);
      } else {
        mergedArray.push(element);
      }
    });
    //console.log('Executing query:', fullQuery, mergedArray);
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
      description_en: row.description_en,
      qualification: row.qualification,
      demography_id: row.demography_id,
      demographic_name: row.demographic_name,
      visible: row.visible,
      image: row.image,
      rank: row.rank,
    };
  }
}
