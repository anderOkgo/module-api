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

  it('keeps each user in their own table (table-per-user design), fully isolated from one another', async () => {
    // This is the actual invariant the per-user-table schema (and its
    // recently-hardened stored procedures, see docs/specification-roadmap.md
    // Phase 5) exists to guarantee: two different users must land in two
    // different, auto-created tables, and never see each other's rows.
    const otherUsername = `e2e${suffix}b`;
    const otherTableName = `movements_${otherUsername}`;
    const otherToken = signToken({ username: otherUsername });

    try {
      await rawQuery('MYDATABASEFINAN', 'CALL proc_create_movements_table(?)', [otherUsername]);

      const insertA = await request(app)
        .post('/api/finan/insert')
        .set('Authorization', bearer(token))
        .send({
          movement_name: 'Isolation Check A',
          movement_val: 111,
          movement_date: '2026-02-01',
          movement_type: 1,
          movement_tag: 'e2e-isolation',
          currency: 'COP',
        });
      expect(insertA.status).toBe(201);

      const insertB = await request(app)
        .post('/api/finan/insert')
        .set('Authorization', bearer(otherToken))
        .send({
          movement_name: 'Isolation Check B',
          movement_val: 222,
          movement_date: '2026-02-02',
          movement_type: 1,
          movement_tag: 'e2e-isolation',
          currency: 'COP',
        });
      expect(insertB.status).toBe(201);

      const rowsA = await rawQuery<any[]>(
        'MYDATABASEFINAN',
        `SELECT name, user FROM \`${tableName}\` WHERE name = ?`,
        ['Isolation Check A']
      );
      const rowsB = await rawQuery<any[]>(
        'MYDATABASEFINAN',
        `SELECT name, user FROM \`${otherTableName}\` WHERE name = ?`,
        ['Isolation Check B']
      );
      expect(rowsA).toHaveLength(1);
      expect(rowsB).toHaveLength(1);
      expect(rowsA[0].user).toBe(testUsername);
      expect(rowsB[0].user).toBe(otherUsername);

      // Neither user's table contains the other user's row.
      const crossA = await rawQuery<any[]>(
        'MYDATABASEFINAN',
        `SELECT * FROM \`${tableName}\` WHERE name = ?`,
        ['Isolation Check B']
      );
      const crossB = await rawQuery<any[]>(
        'MYDATABASEFINAN',
        `SELECT * FROM \`${otherTableName}\` WHERE name = ?`,
        ['Isolation Check A']
      );
      expect(crossA).toHaveLength(0);
      expect(crossB).toHaveLength(0);
    } finally {
      await rawQuery('MYDATABASEFINAN', `DROP TABLE IF EXISTS \`${otherTableName}\``);
    }
  });

  it('updates and deletes a movement for a user whose username has uppercase letters (regression)', async () => {
    // Registration allows uppercase in usernames (see register.use-case.ts's
    // /^[a-zA-Z0-9_]{3,20}$/) and the JWT carries whatever casing was used at
    // registration, unmodified. create()/initial-load already lowercase
    // before touching the DB; update/delete didn't, so they looked up
    // movements_<MixedCase> - a different (nonexistent) table on a
    // case-sensitive MariaDB - and always reported "Movement not found".
    const mixedCaseUsername = `E2E${suffix}Mixed`;
    const mixedCaseToken = signToken({ username: mixedCaseUsername });
    const mixedCaseTableName = `movements_${mixedCaseUsername.toLowerCase()}`;

    try {
      // /insert (unlike /initial-load) never calls createTableForUser itself
      // - create it directly first, same as the isolation test above.
      await rawQuery('MYDATABASEFINAN', 'CALL proc_create_movements_table(?)', [
        mixedCaseUsername.toLowerCase(),
      ]);

      const createRes = await request(app)
        .post('/api/finan/insert')
        .set('Authorization', bearer(mixedCaseToken))
        .send({
          movement_name: 'Mixed Case Regression',
          movement_val: 50,
          movement_date: '2026-03-01',
          movement_type: 1,
          movement_tag: 'e2e-mixed-case',
          currency: 'COP',
        });
      expect(createRes.status).toBe(201);
      const mixedCaseId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/finan/update/${mixedCaseId}`)
        .set('Authorization', bearer(mixedCaseToken))
        .send({
          movement_name: 'Mixed Case Regression Updated',
          movement_val: 75,
          movement_date: '2026-03-02',
          movement_type: 1,
          movement_tag: 'e2e-mixed-case',
          currency: 'COP',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.name).toBe('Mixed Case Regression Updated');

      const deleteRes = await request(app)
        .delete(`/api/finan/delete/${mixedCaseId}`)
        .set('Authorization', bearer(mixedCaseToken));
      expect(deleteRes.status).toBe(200);

      const rows = await rawQuery<any[]>(
        'MYDATABASEFINAN',
        `SELECT * FROM \`${mixedCaseTableName}\` WHERE id = ?`,
        [mixedCaseId]
      );
      expect(rows).toHaveLength(0);
    } finally {
      await rawQuery('MYDATABASEFINAN', `DROP TABLE IF EXISTS \`${mixedCaseTableName}\``);
    }
  });
});
