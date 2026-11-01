import request from 'supertest';
import { buildTestApp } from './helpers/build-test-app';
import { signToken, bearer, TEST_SECRET_KEY } from './helpers/jwt';
import { BitacoraRepository } from '../../src/modules/bitacora/application/ports/bitacora.repository';

process.env.SECRET_KEY = TEST_SECRET_KEY;

jest.mock('../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql');

import { BitacoraMysqlRepository } from '../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql';
import { buildBitacoraModule } from '../../src/modules/bitacora/infrastructure/config/bitacora.module';

const MockedRepository = BitacoraMysqlRepository as jest.MockedClass<typeof BitacoraMysqlRepository>;

const mockRepo: jest.Mocked<BitacoraRepository> = {
  findEntry: jest.fn(),
  hasEntry: jest.fn(),
  findByMonthDays: jest.fn(),
  listDates: jest.fn(),
  saveEntry: jest.fn(),
  moveToTrash: jest.fn(),
  listTrash: jest.fn(),
  restoreFromTrash: jest.fn(),
  importEntries: jest.fn(),
};
MockedRepository.mockImplementation(() => mockRepo as any);

const bitacoraModule = buildBitacoraModule();
const app = buildTestApp([{ path: '/api/bitacora', router: bitacoraModule.router }]);

const USER_ID = 42;
const auth = bearer(signToken({ userId: USER_ID, username: 'TestUser' }));
const today = new Date().toISOString().slice(0, 10);
const entry = { date: '2020-03-04', body: 'Private text', modified: '2026-10-31T10:00:00Z', version: 1 };

describe('Bitacora module — integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exposes the router, controller, repository and use cases', () => {
    expect(bitacoraModule.bitacoraController).toBeDefined();
    expect(bitacoraModule.bitacoraRepository).toBe(mockRepo);
    expect(bitacoraModule.saveEntry).toBeDefined();
  });

  describe('auth gate (S1)', () => {
    const routes: Array<[string, string]> = [
      ['get', '/api/bitacora/home/2020-03-04'],
      ['get', '/api/bitacora/entries/2020-03-04/nearby'],
      ['get', '/api/bitacora/entries/2020-03-04'],
      ['put', '/api/bitacora/entries/2020-03-04'],
      ['delete', '/api/bitacora/entries/2020-03-04'],
      ['get', '/api/bitacora/entries?month=2020-03'],
      ['post', '/api/bitacora/entries/import'],
      ['get', '/api/bitacora/trash'],
      ['post', '/api/bitacora/trash/2020-03-04/restore'],
    ];

    it.each(routes)('%s %s without a token → 401', async (method, path) => {
      const res = await (request(app) as any)[method](path).send({});
      expect(res.status).toBe(401);
    });

    it.each(routes)('%s %s with an invalid token → 401', async (method, path) => {
      const res = await (request(app) as any)[method](path).set('Authorization', bearer('not-a-token')).send({});
      expect(res.status).toBe(401);
    });

    it('a token without userId → 401 even if the body claims one (D1)', async () => {
      const noUserId = bearer(require('jsonwebtoken').sign({ username: 'x' }, TEST_SECRET_KEY));
      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set('Authorization', noUserId)
        .send({ userId: 1, body: 'x', baseVersion: null });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ success: false, message: 'Unauthorized: the token carries no user id' });
      expect(mockRepo.saveEntry).not.toHaveBeenCalled();
    });

    it('a body userId never overrides the token one (S2)', async () => {
      mockRepo.findEntry.mockResolvedValue(entry);
      await request(app).get('/api/bitacora/entries/2020-03-04').set('Authorization', auth).send({ userId: 1 });
      expect(mockRepo.findEntry).toHaveBeenCalledWith(USER_ID, '2020-03-04');
    });
  });

  describe('route ordering (S4)', () => {
    it('GET /entries?month= reaches the month handler', async () => {
      mockRepo.listDates.mockResolvedValue(['2020-03-04']);
      const res = await request(app).get('/api/bitacora/entries?month=2020-03').set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ month: '2020-03', dates: ['2020-03-04'] });
      expect(mockRepo.findEntry).not.toHaveBeenCalled();
    });

    it('POST /entries/import reaches the import handler', async () => {
      mockRepo.importEntries.mockResolvedValue({ created: ['2020-03-04'], overwritten: [], skipped: [] });
      const res = await request(app)
        .post('/api/bitacora/entries/import')
        .set('Authorization', auth)
        .send({ entries: [{ date: '2020-03-04', body: 'x' }], onConflict: 'skip' });
      expect(res.status).toBe(200);
      expect(mockRepo.importEntries).toHaveBeenCalledWith(USER_ID, [{ date: '2020-03-04', body: 'x' }], 'skip');
    });

    it('GET /entries/:date/nearby reaches the nearby handler', async () => {
      mockRepo.findByMonthDays.mockResolvedValue([]);
      const res = await request(app).get('/api/bitacora/entries/2020-03-04/nearby').set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(mockRepo.findEntry).not.toHaveBeenCalled();
    });
  });

  describe('endpoints and the D3 envelope', () => {
    it('GET /home/:date', async () => {
      mockRepo.findEntry.mockResolvedValue(null);
      mockRepo.hasEntry.mockResolvedValue(false);
      mockRepo.findByMonthDays.mockResolvedValue([]);
      const res = await request(app).get('/api/bitacora/home/2020-03-04').set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Home loaded',
        data: { date: '2020-03-04', entry: null, previousDay: { date: '2020-03-03', written: false }, onThisDay: [] },
      });
    });

    it('GET /entries/:date → 404 envelope (A9)', async () => {
      mockRepo.findEntry.mockResolvedValue(null);
      const res = await request(app).get('/api/bitacora/entries/2020-03-04').set('Authorization', auth);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: 'Entry not found' });
    });

    it('PUT /entries/:date → 201 on create (A1)', async () => {
      mockRepo.saveEntry.mockResolvedValue({ kind: 'created', entry });
      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set('Authorization', auth)
        .send({ body: '  Private text  ', baseVersion: null });
      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(entry);
      expect(mockRepo.saveEntry).toHaveBeenCalledWith(USER_ID, '2020-03-04', 'Private text', null);
    });

    it('PUT /entries/:date → 409 with the stored entry (A3)', async () => {
      mockRepo.saveEntry.mockResolvedValue({ kind: 'conflict', entry: { ...entry, version: 3 } });
      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set('Authorization', auth)
        .send({ body: 'Old', baseVersion: 2 });
      expect(res.status).toBe(409);
      expect(res.body).toEqual({
        success: false,
        message: 'The entry changed on another device',
        data: { ...entry, version: 3 },
      });
    });

    it('PUT /entries/:date → 400 with errors on an empty body (A5)', async () => {
      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set('Authorization', auth)
        .send({ body: '   ', baseVersion: null });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, message: 'Invalid request', errors: ['body must not be empty'] });
    });

    it.each(['2026-02-30', '2026-13-01', 'abc', '1899-12-31'])('GET /entries/%s → 400 (A8)', async (date) => {
      const res = await request(app).get(`/api/bitacora/entries/${date}`).set('Authorization', auth);
      expect(res.status).toBe(400);
    });

    it("accepts tomorrow's UTC date and rejects the day after (A8)", async () => {
      mockRepo.findEntry.mockResolvedValue(null);
      const plus = (days: number) => new Date(Date.parse(today) + days * 86400000).toISOString().slice(0, 10);
      const tomorrow = await request(app).get(`/api/bitacora/entries/${plus(1)}`).set('Authorization', auth);
      const later = await request(app).get(`/api/bitacora/entries/${plus(2)}`).set('Authorization', auth);
      expect(tomorrow.status).toBe(404);
      expect(later.status).toBe(400);
    });

    it('DELETE /entries/:date → 200 with purgeOn (T1)', async () => {
      mockRepo.moveToTrash.mockResolvedValue({ deletedAt: '2026-10-31T12:00:00Z' });
      const res = await request(app).delete('/api/bitacora/entries/2020-03-04').set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ date: '2020-03-04', purgeOn: '2026-11-30T12:00:00Z' });
    });

    it('GET /trash', async () => {
      mockRepo.listTrash.mockResolvedValue([]);
      const res = await request(app).get('/api/bitacora/trash').set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(mockRepo.listTrash).toHaveBeenCalledWith(USER_ID);
    });

    it('POST /trash/:date/restore without a body uses "fail"', async () => {
      mockRepo.restoreFromTrash.mockResolvedValue({ kind: 'restored', entry });
      const res = await request(app).post('/api/bitacora/trash/2020-03-04/restore').set('Authorization', auth);
      expect(res.status).toBe(200);
      expect(mockRepo.restoreFromTrash).toHaveBeenCalledWith(USER_ID, '2020-03-04', 'fail');
    });

    it('GET /entries?month=2026-13 → 400 (M2)', async () => {
      const res = await request(app).get('/api/bitacora/entries?month=2026-13').set('Authorization', auth);
      expect(res.status).toBe(400);
    });
  });

  describe('unexpected failures (N2)', () => {
    it('return 500 and log only the error message, never the SQL or the entry text', async () => {
      const driverError = Object.assign(new Error('ER_SOMETHING: failed'), {
        sql: "UPDATE entries SET body = 'Private text'",
      });
      mockRepo.saveEntry.mockRejectedValue(driverError);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set('Authorization', auth)
        .send({ body: 'Private text', baseVersion: null });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, message: 'Internal server error' });
      expect(errorSpy).toHaveBeenCalledWith('Bitacora saveEntry failed:', 'ER_SOMETHING: failed');
      expect(JSON.stringify(errorSpy.mock.calls)).not.toContain('Private text');
      errorSpy.mockRestore();
    });

    it('logs a placeholder when something other than an Error is thrown', async () => {
      mockRepo.listTrash.mockRejectedValue('boom');
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/api/bitacora/trash').set('Authorization', auth);
      expect(res.status).toBe(500);
      expect(errorSpy).toHaveBeenCalledWith('Bitacora listTrash failed:', 'unknown error');
      errorSpy.mockRestore();
    });
  });
});
