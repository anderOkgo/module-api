import dotenv from 'dotenv';
dotenv.config();

import request from 'supertest';
import { buildTestApp } from '../integration/helpers/build-test-app';
import { signToken, bearer } from '../integration/helpers/jwt';
import { rawQuery } from './helpers/db';
import { buildFinanModule } from '../../src/modules/finan/infrastructure/config/finan.module';

const app = buildTestApp([{ path: '/api/finan', router: buildFinanModule().router }]);

const suffix = Date.now().toString().slice(-8);
const testUsername = `e2e${suffix}`;
const tableName = `movements_${testUsername}`;
const token = signToken({ username: testUsername });

describe('Finan E2E (real database)', () => {
  beforeAll(async () => {
    // The app itself only creates this table as a fire-and-forget side effect
    // of /initial-load, which would be racy to rely on here — create it
    // directly (idempotent: CREATE TABLE IF NOT EXISTS) before running.
    await rawQuery('MYDATABASEFINAN', 'CALL proc_create_movements_table(?)', [testUsername]);
  });

  afterAll(async () => {
    await rawQuery('MYDATABASEFINAN', `DROP TABLE IF EXISTS \`${tableName}\``);
  });

  let createdId: number;

  it('creates a real movement row', async () => {
    const res = await request(app)
      .post('/api/finan/insert')
      .set('Authorization', bearer(token))
      .send({
        movement_name: 'E2E Test Movement',
        movement_val: 1000,
        movement_date: '2026-01-15',
        movement_type: 1, // income
        movement_tag: 'e2e-test',
        currency: 'COP',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('E2E Test Movement');
    createdId = res.body.data.id;

    const rows = await rawQuery<any[]>('MYDATABASEFINAN', `SELECT * FROM \`${tableName}\` WHERE id = ?`, [
      createdId,
    ]);
    expect(rows).toHaveLength(1);
    expect(Number(rows[0].value)).toBe(1000);
  });

  it('prevents a duplicate insert (same name + date) and returns the existing row instead', async () => {
    const res = await request(app)
      .post('/api/finan/insert')
      .set('Authorization', bearer(token))
      .send({
        movement_name: 'E2E Test Movement',
        movement_val: 1000,
        movement_date: '2026-01-15',
        movement_type: 1,
        movement_tag: 'e2e-test',
        currency: 'COP',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toBe('Movement already exists (duplicate prevented)');
    expect(res.body.data.id).toBe(createdId);
  });

  it('retrieves the movement through /initial-load', async () => {
    const res = await request(app)
      .post('/api/finan/initial-load')
      .set('Authorization', bearer(token))
      .send({ currency: 'COP' });

    expect(res.status).toBe(200);
    expect(res.body.data.movements.some((m: any) => m.id === createdId)).toBe(true);
  });

  it('updates the real movement row', async () => {
    const res = await request(app)
      .put(`/api/finan/update/${createdId}`)
      .set('Authorization', bearer(token))
      .send({
        movement_name: 'E2E Test Movement Updated',
        movement_val: 1500,
        movement_date: '2026-01-16',
        movement_type: 1,
        movement_tag: 'e2e-test-updated',
        currency: 'COP',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('E2E Test Movement Updated');

    const rows = await rawQuery<any[]>('MYDATABASEFINAN', `SELECT * FROM \`${tableName}\` WHERE id = ?`, [
      createdId,
    ]);
    expect(Number(rows[0].value)).toBe(1500);
  });

  it('rejects updating a movement id that does not exist', async () => {
    const res = await request(app)
      .put('/api/finan/update/999999999')
      .set('Authorization', bearer(token))
      .send({
        movement_name: 'Ghost',
        movement_val: 1,
        movement_date: '2026-01-16',
        movement_type: 1,
        movement_tag: 'ghost',
        currency: 'COP',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Movement not found');
  });

  it('deletes the real movement row', async () => {
    const res = await request(app).delete(`/api/finan/delete/${createdId}`).set('Authorization', bearer(token));

    expect(res.status).toBe(200);

    const rows = await rawQuery<any[]>('MYDATABASEFINAN', `SELECT * FROM \`${tableName}\` WHERE id = ?`, [
      createdId,
    ]);
    expect(rows).toHaveLength(0);
  });
});
