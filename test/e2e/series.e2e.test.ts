import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { buildTestApp } from '../integration/helpers/build-test-app';
import { signAdminToken, bearer } from '../integration/helpers/jwt';
import { rawQuery } from './helpers/db';
import { buildSeriesModule } from '../../src/modules/series/infrastructure/config/series.module';

const app = buildTestApp([{ path: '/api/series', router: buildSeriesModule().router }]);

const suffix = Date.now().toString().slice(-8);
const testSeriesName = `__E2E_TEST_SERIES_${suffix}__`;
const adminToken = bearer(signAdminToken({ username: 'e2e-admin' }));

describe('Series E2E (real database)', () => {
  let seriesId: number;
  let realDemographyId: number;
  let realGenreIds: number[];

  beforeAll(async () => {
    // Read real reference data — these are read-only lookups against the
    // existing catalog, never mutated by this suite.
    const demographics = await rawQuery<any[]>('MYDATABASEANIME', 'SELECT id FROM demographics LIMIT 1');
    realDemographyId = demographics[0].id;

    const genres = await rawQuery<any[]>('MYDATABASEANIME', 'SELECT id FROM genres LIMIT 2');
    realGenreIds = genres.map((g) => g.id);
  });

  afterAll(async () => {
    if (seriesId) {
      await rawQuery('MYDATABASEANIME', 'DELETE FROM productions_genres WHERE production_id = ?', [seriesId]);
      await rawQuery('MYDATABASEANIME', 'DELETE FROM titles WHERE production_id = ?', [seriesId]);
      await rawQuery('MYDATABASEANIME', 'DELETE FROM productions WHERE id = ?', [seriesId]);
    }
  });

  it('creates a real series row', async () => {
    const res = await request(app)
      .post('/api/series/create')
      .set('Authorization', adminToken)
      .field('name', testSeriesName)
      .field('chapter_number', '12')
      .field('year', '2024')
      .field('description', 'E2E test series')
      .field('description_en', 'E2E test series EN')
      .field('qualification', '9')
      .field('demography_id', String(realDemographyId))
      .field('visible', 'true');

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe(testSeriesName);
    seriesId = res.body.data.id;

    const rows = await rawQuery<any[]>('MYDATABASEANIME', 'SELECT * FROM productions WHERE id = ?', [seriesId]);
    expect(rows).toHaveLength(1);
    expect(rows[0].name).toBe(testSeriesName);
  });

  it('retrieves the real series by id', async () => {
    const res = await request(app).get(`/api/series/${seriesId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(testSeriesName);
    expect(res.body.data.demography_id).toBe(realDemographyId);
  });

  it('updates the real series row (qualification gets re-ranked, not stored verbatim)', async () => {
    const res = await request(app)
      .put(`/api/series/${seriesId}`)
      .set('Authorization', adminToken)
      .field('qualification', '7.5');

    expect(res.status).toBe(200);
    // update_rank() (called by the handler after every write) recomputes
    // `qualification` for the ENTIRE productions table based on rank position
    // (interpolated between 7.0 and 9.7) — it does NOT persist the submitted
    // value verbatim. Only real E2E against the full catalog surfaces this;
    // asserting an exact value here would be asserting a coincidence.
    expect(res.body.data.qualification).toBeGreaterThanOrEqual(7);
    expect(res.body.data.qualification).toBeLessThanOrEqual(9.7);

    const rows = await rawQuery<any[]>('MYDATABASEANIME', 'SELECT qualification FROM productions WHERE id = ?', [
      seriesId,
    ]);
    expect(Number(rows[0].qualification)).toBe(res.body.data.qualification);
  });

  it('rejects assigning a genre id that does not exist in the real catalog', async () => {
    const res = await request(app)
      .post(`/api/series/${seriesId}/genres`)
      .set('Authorization', adminToken)
      .send({ genreIds: [999999] });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('Invalid genre IDs');
  });

  it('assigns real genres to the series', async () => {
    const res = await request(app)
      .post(`/api/series/${seriesId}/genres`)
      .set('Authorization', adminToken)
      .send({ genreIds: realGenreIds });

    expect(res.status).toBe(200);

    const rows = await rawQuery<any[]>(
      'MYDATABASEANIME',
      'SELECT genre_id FROM productions_genres WHERE production_id = ? ORDER BY genre_id',
      [seriesId]
    );
    expect(rows.map((r) => r.genre_id)).toEqual([...realGenreIds].sort((a, b) => a - b));
  });

  it('adds alternative titles to the series', async () => {
    const res = await request(app)
      .post(`/api/series/${seriesId}/titles`)
      .set('Authorization', adminToken)
      .send({ titles: ['E2E Alt Title 1', 'E2E Alt Title 2'] });

    expect(res.status).toBe(200);

    const rows = await rawQuery<any[]>('MYDATABASEANIME', 'SELECT name FROM titles WHERE production_id = ?', [
      seriesId,
    ]);
    expect(rows.map((r) => r.name).sort()).toEqual(['E2E Alt Title 1', 'E2E Alt Title 2']);
  });

  it('reflects genres and titles when reading the series back', async () => {
    const res = await request(app).get(`/api/series/${seriesId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.genres).toHaveLength(realGenreIds.length);
    expect(res.body.data.titles).toHaveLength(2);
  });

  it('removes one genre from the series', async () => {
    const res = await request(app)
      .delete(`/api/series/${seriesId}/genres`)
      .set('Authorization', adminToken)
      .send({ genreIds: [realGenreIds[0]] });

    expect(res.status).toBe(200);

    const rows = await rawQuery<any[]>(
      'MYDATABASEANIME',
      'SELECT genre_id FROM productions_genres WHERE production_id = ?',
      [seriesId]
    );
    expect(rows.map((r) => r.genre_id)).toEqual([realGenreIds[1]]);
  });

  it('soft-deletes the series (sets visible = 0, row stays)', async () => {
    const res = await request(app).delete(`/api/series/${seriesId}`).set('Authorization', adminToken);

    expect(res.status).toBe(200);

    const rows = await rawQuery<any[]>('MYDATABASEANIME', 'SELECT visible FROM productions WHERE id = ?', [
      seriesId,
    ]);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].visible)).toBe(0);
  });

  it('rejects operating on a series id that does not exist', async () => {
    const res = await request(app).get('/api/series/999999999');

    expect(res.status).toBe(404);
  });
});
