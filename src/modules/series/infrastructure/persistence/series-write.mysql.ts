import { Database, QueryExecutor } from '../../../../infrastructure/my.database.helper';
import { SeriesWriteRepository } from '../../application/ports/series-write.repository';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../domain/entities/series.entity';

export class SeriesWriteMysqlRepository implements SeriesWriteRepository {
  private database: Database;

  // When `exec` is provided, this instance is scoped to an already-open
  // transaction (see runInTransaction below) and every write goes through it
  // instead of opening its own pooled connection per statement.
  constructor(private readonly exec?: QueryExecutor) {
    this.database = new Database('MYDATABASEANIME');
  }

  private async runQuery(query: string, params: any): Promise<any> {
    if (this.exec) {
      return this.exec(query, params);
    }
    const result = await this.database.executeSafeQuery(query, params);
    if (result.errorSys) {
      throw new Error(result.message);
    }
    return result;
  }

  async runInTransaction<T>(work: (repo: SeriesWriteRepository) => Promise<T>): Promise<T> {
    return this.database.runInTransaction((txExec) => work(new SeriesWriteMysqlRepository(txExec)));
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

    const result = await this.runQuery(query, params);

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

    await this.runQuery(query, params);
  }

  async delete(id: number): Promise<boolean> {
    const query = 'UPDATE productions SET visible = 0 WHERE id = ?';
    const result = await this.runQuery(query, [id]);

    return result.affectedRows > 0;
  }

  async updateImage(id: number, imagePath: string): Promise<boolean> {
    const query = 'UPDATE productions SET image = ? WHERE id = ?';
    const result = await this.runQuery(query, [imagePath, id]);

    return result.affectedRows > 0;
  }

  async assignGenres(seriesId: number, genreIds: number[]): Promise<boolean> {
    const doWork = async (exec: QueryExecutor) => {
      await exec('DELETE FROM productions_genres WHERE production_id = ?', [seriesId]);

      if (genreIds.length > 0) {
        const values = genreIds.map((gid) => `(${seriesId}, ${gid})`).join(',');
        await exec(`INSERT INTO productions_genres (production_id, genre_id) VALUES ${values}`, []);
      }
    };

    if (this.exec) {
      // Already inside an outer transaction (e.g. called from
      // runInTransaction) - don't open a nested one, just reuse it.
      await doWork(this.exec);
    } else {
      // Standalone call: make the delete+insert atomic so a failed insert
      // can never leave a series with zero genres.
      await this.database.runInTransaction(doWork);
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

    await this.runQuery(query, [seriesId, ...genreIds]);

    return true;
  }

  async addTitles(seriesId: number, titles: string[]): Promise<boolean> {
    if (titles.length === 0) return true;

    const placeholders = titles.map(() => '(?, ?)').join(',');
    const params = titles.flatMap((t) => [seriesId, t]);
    const query = `INSERT INTO titles (production_id, name) VALUES ${placeholders}`;

    await this.runQuery(query, params);

    return true;
  }

  async removeTitles(seriesId: number, titleIds: number[]): Promise<boolean> {
    if (titleIds.length === 0) return true;

    const placeholders = titleIds.map(() => '?').join(',');
    const query = `
      DELETE FROM titles
      WHERE production_id = ? AND id IN (${placeholders})
    `;

    await this.runQuery(query, [seriesId, ...titleIds]);

    return true;
  }

  async updateRank(): Promise<void> {
    const query = 'CALL update_rank()';
    await this.runQuery(query, []);
  }
}
