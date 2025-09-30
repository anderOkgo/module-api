import { Database, HDB } from '../../../../infrastructure/my.database.helper';
import Series, { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';
import { ProductionRepository } from '../../application/ports/series.repository';

export class ProductionMysqlRepository implements ProductionRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  public async getProduction(production: Series) {
    const viewName = 'view_all_info_produtions';
    const initialQuery = `SELECT * FROM ${viewName} WHERE 1`;
    const conditions: string[] = [];
    const conditionsVals: any[] = [];

    const conditionMap: Record<string, (label: string, value: any) => string> = {
      production_name: HDB.generateLikeCondition,
      production_number_chapters: HDB.generateBetweenCondition,
      production_description: HDB.generateLikeCondition,
      production_year: HDB.generateBetweenCondition,
      demographic_name: HDB.generateEqualCondition,
      genre_names: HDB.generateAndCondition,
      id: HDB.generateInCondition,
    };

    for (const [key, value] of Object.entries(production)) {
      if (conditionMap[key]) {
        conditions.push(conditionMap[key](key, value)); // call the HDB fucntion to get a SQL string
        conditionsVals.push(value); // push the value for the previous SQL string
      }
    }

    conditions.push(HDB.generateOrderBy('production_ranking_number', 'ASC'));
    conditions.push(HDB.generateLimit());
    const fullQuery = `${initialQuery} ${conditions.join(' ')}`; // create full SQL string
    conditionsVals.push(parseInt(production.limit));
    const mergedArray: any[] = [];
    conditionsVals.forEach((element) => {
      if (Array.isArray(element)) {
        mergedArray.push(...element); // flat the array
      } else {
        mergedArray.push(element);
      }
    });

    return await this.database.executeSafeQuery(fullQuery, mergedArray);
  }

  public async getProductionYears() {
    const fullQuery: string = 'SELECT * FROM view_all_years_productions';
    return await this.database.executeSafeQuery(fullQuery);
  }

  // Métodos CRUD
  async create(series: SeriesCreateRequest): Promise<Series> {
    const query = `
      INSERT INTO productions
      (name, chapter_numer, year, description, qualification, demography_id, visible, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, '')
    `;
    const params = [
      series.name,
      series.chapter_number,
      series.year,
      series.description,
      series.qualification,
      series.demography_id,
      series.visible,
    ];
    const result = await this.database.executeSafeQuery(query, params);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    const createdSeries = await this.findById(result.insertId);
    if (!createdSeries) {
      throw new Error('Error al crear la serie');
    }
    return createdSeries;
  }

  async findById(id: number): Promise<Series | null> {
    const query = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      WHERE p.id = ?
    `;
    const result = await this.database.executeSafeQuery(query, [id]);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result.length > 0 ? result[0] : null;
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Series[]> {
    const query = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      ORDER BY p.rank ASC, p.qualification DESC
      LIMIT ? OFFSET ?
    `;
    const result = await this.database.executeSafeQuery(query, [limit, offset]);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result;
  }

  async update(id: number, series: SeriesUpdateRequest): Promise<Series> {
    const updateFields: string[] = [];
    const params: any[] = [];

    // Mapeo de campos del modelo a campos de la base de datos
    const fieldMapping: Record<string, string> = {
      chapter_number: 'chapter_numer',
    };

    Object.entries(series).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        const dbField = fieldMapping[key] || key;
        updateFields.push(`${dbField} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No hay campos para actualizar');
    }

    params.push(id);

    const query = `UPDATE productions SET ${updateFields.join(', ')} WHERE id = ?`;
    const result = await this.database.executeSafeQuery(query, params);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    if (result.affectedRows === 0) {
      throw new Error('Producción no encontrada');
    }
    const updatedSeries = await this.findById(id);
    if (!updatedSeries) {
      throw new Error('Error al actualizar la serie');
    }
    return updatedSeries;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM productions WHERE id = ?';
    const result = await this.database.executeSafeQuery(query, [id]);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result.affectedRows > 0;
  }

  async updateImage(id: number, imagePath: string): Promise<boolean> {
    const query = 'UPDATE productions SET image = ? WHERE id = ?';
    const result = await this.database.executeSafeQuery(query, [imagePath, id]);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result.affectedRows > 0;
  }

  async search(filters: Partial<Series>): Promise<Series[]> {
    let query = `
      SELECT p.*, d.name as demographic_name
      FROM productions p
      LEFT JOIN demographics d ON p.demography_id = d.id
      WHERE 1=1
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters.production_name) {
      conditions.push('p.name LIKE ?');
      params.push(`%${filters.production_name}%`);
    }
    if (filters.production_year) {
      conditions.push('p.year = ?');
      params.push(filters.production_year);
    }
    if (filters.demography_id) {
      conditions.push('p.demography_id = ?');
      params.push(filters.demography_id);
    }
    if (filters.visible !== undefined) {
      conditions.push('p.visible = ?');
      params.push(filters.visible);
    }

    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }

    query += ' ORDER BY p.rank ASC, p.qualification DESC LIMIT 100';
    const result = await this.database.executeSafeQuery(query, params);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result;
  }

  // Métodos para manejar relaciones
  async assignGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    try {
      // Eliminar géneros existentes
      await this.database.executeSafeQuery('DELETE FROM productions_genres WHERE production_id = ?', [seriesId]);

      // Insertar nuevos géneros
      if (genreIds.length > 0) {
        const values = genreIds.map((genreId) => `(${seriesId}, ${genreId})`).join(',');
        const query = `INSERT INTO productions_genres (production_id, genre_id) VALUES ${values}`;
        const result = await this.database.executeSafeQuery(query, []);
        if (result.errorSys) {
          throw new Error(result.message);
        }
      }
      return true;
    } catch (error) {
      throw new Error(`Error assigning genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    try {
      const placeholders = genreIds.map(() => '?').join(',');
      const query = `DELETE FROM productions_genres WHERE production_id = ? AND genre_id IN (${placeholders})`;
      const params = [seriesId, ...genreIds];

      const result = await this.database.executeSafeQuery(query, params);
      if (result.errorSys) {
        throw new Error(result.message);
      }
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error removing genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addTitles(seriesId: number, titles: string[]): Promise<boolean> {
    try {
      if (titles.length === 0) return true;

      const values = titles.map((title) => `(${seriesId}, '${title.replace(/'/g, "''")}')`).join(',');
      const query = `INSERT INTO titles (production_id, name) VALUES ${values}`;

      const result = await this.database.executeSafeQuery(query, []);
      if (result.errorSys) {
        throw new Error(result.message);
      }
      return true;
    } catch (error) {
      throw new Error(`Error adding titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeTitles(seriesId: number, titleIds: number[]): Promise<boolean> {
    try {
      const placeholders = titleIds.map(() => '?').join(',');
      const query = `DELETE FROM titles WHERE production_id = ? AND id IN (${placeholders})`;
      const params = [seriesId, ...titleIds];

      const result = await this.database.executeSafeQuery(query, params);
      if (result.errorSys) {
        throw new Error(result.message);
      }
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error removing titles: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Métodos para obtener catálogos
  async getGenres(): Promise<any[]> {
    try {
      const query = 'SELECT id, name, slug FROM genres ORDER BY name ASC';
      const result = await this.database.executeSafeQuery(query, []);
      if (result.errorSys) {
        throw new Error(result.message);
      }
      return result;
    } catch (error) {
      throw new Error(`Error getting genres: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getDemographics(): Promise<any[]> {
    try {
      const query = 'SELECT id, name, slug FROM demographics ORDER BY name ASC';
      const result = await this.database.executeSafeQuery(query, []);
      if (result.errorSys) {
        throw new Error(result.message);
      }
      return result;
    } catch (error) {
      throw new Error(`Error getting demographics: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
