import { Database } from '../../../../infrastructure/my.database.helper';
import { SeriesWriteRepository } from '../../application/ports/series-write.repository';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

export class SeriesWriteMysqlRepository implements SeriesWriteRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  async create(series: SeriesCreateRequest): Promise<{ id: number; [key: string]: any }> {
    const query = `
      INSERT INTO productions
      (name, chapter_numer, year, description, description_en, qualification, demography_id, visible, image)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')
    `;

    const params = [
      series.name,
      series.chapter_number,
      series.year,
      series.description,
      series.description_en,
      series.qualification,
      series.demography_id,
      series.visible,
    ];

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return { id: result.insertId };
  }

  async update(id: number, series: SeriesUpdateRequest): Promise<void> {
    const updateFields: string[] = [];
    const params: any[] = [];

    Object.entries(series).forEach(([key, value]) => {
      if (key !== 'id' && value !== undefined) {
        const dbField = key === 'chapter_number' ? 'chapter_numer' : key;
        updateFields.push(`${dbField} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      throw new Error('No fields to update');
    }

    params.push(id);
    const query = `UPDATE productions SET ${updateFields.join(', ')} WHERE id = ?`;

    const result = await this.database.executeSafeQuery(query, params);

    if (result.errorSys) {
      throw new Error(result.message);
    }
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

  async assignGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    // Eliminar asignaciones existentes
    const deleteQuery = 'DELETE FROM productions_genres WHERE production_id = ?';
    await this.database.executeSafeQuery(deleteQuery, [seriesId]);

    // Insertar nuevas asignaciones
    if (genreIds.length > 0) {
      const values = genreIds.map((gid) => `(${seriesId}, ${gid})`).join(',');
      const insertQuery = `INSERT INTO productions_genres (production_id, genre_id) VALUES ${values}`;
      const result = await this.database.executeSafeQuery(insertQuery, []);

      if (result.errorSys) {
        throw new Error(result.message);
      }
    }

    return true;
  }

  async removeGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    if (genreIds.length === 0) return true;

    const placeholders = genreIds.map(() => '?').join(',');
    const query = `
      DELETE FROM productions_genres 
      WHERE production_id = ? AND genre_id IN (${placeholders})
    `;

    const result = await this.database.executeSafeQuery(query, [seriesId, ...genreIds]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return true;
  }

  async addTitles(seriesId: number, titles: string[]): Promise<boolean> {
    if (titles.length === 0) return true;

    const values = titles.map((t) => `(${seriesId}, '${t.replace(/'/g, "''")}')`).join(',');
    const query = `INSERT INTO titles (production_id, name) VALUES ${values}`;

    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return true;
  }

  async removeTitles(seriesId: number, titleIds: number[]): Promise<boolean> {
    if (titleIds.length === 0) return true;

    const placeholders = titleIds.map(() => '?').join(',');
    const query = `
      DELETE FROM titles 
      WHERE production_id = ? AND id IN (${placeholders})
    `;

    const result = await this.database.executeSafeQuery(query, [seriesId, ...titleIds]);

    if (result.errorSys) {
      throw new Error(result.message);
    }

    return true;
  }

  async updateRank(): Promise<void> {
    const query = 'CALL update_rank()';
    const result = await this.database.executeSafeQuery(query, []);

    if (result.errorSys) {
      throw new Error(result.message);
    }
  }
}
