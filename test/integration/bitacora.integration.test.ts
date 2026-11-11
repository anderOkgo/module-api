import request from 'supertest';
import { randomBytes } from 'crypto';
import { buildTestApp } from './helpers/build-test-app';
import { signToken, bearer, TEST_SECRET_KEY } from './helpers/jwt';
import { BitacoraRepository } from '../../src/modules/bitacora/application/ports/bitacora.repository';
import { UserKeyRepository } from '../../src/modules/bitacora/application/ports/diary-key.ports';
import { aesGcmDiaryKeyCrypto } from '../../src/modules/bitacora/infrastructure/crypto/aes-gcm';
import { toBase64url } from '../../src/modules/bitacora/domain/services/key-rules';

process.env.SECRET_KEY = TEST_SECRET_KEY;

jest.mock('../../src/infrastructure/my.database.helper');
jest.mock('../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql');
jest.mock('../../src/modules/bitacora/infrastructure/persistence/user-keys.mysql');

import { BitacoraMysqlRepository } from '../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql';
import { UserKeysMysqlRepository } from '../../src/modules/bitacora/infrastructure/persistence/user-keys.mysql';
import { buildBitacoraModule } from '../../src/modules/bitacora/infrastructure/config/bitacora.module';

const MockedRepository = BitacoraMysqlRepository as jest.MockedClass<typeof BitacoraMysqlRepository>;
const MockedKeys = UserKeysMysqlRepository as jest.MockedClass<typeof UserKeysMysqlRepository>;

/** The account's diary key, made with the real crypto: the device's key (KEK) and what the server stores. */
const KEK = randomBytes(32);
const KEY_HEADER = toBase64url(KEK);
const SALT = toBase64url(randomBytes(16));
const storedKey = {
  kdf: 'PBKDF2-SHA256',
  iterations: 600000,
  salt: SALT,
  wrappedDek: aesGcmDiaryKeyCrypto.wrapDek(42, KEK, randomBytes(32)),
};
const mockKeys: jest.Mocked<UserKeyRepository> = { findKey: jest.fn(), createKey: jest.fn(), replaceKey: jest.fn() };
MockedKeys.mockImplementation(() => mockKeys as any);
/** Use cases pass the request's body cipher on to the repository. */
const CIPHER = expect.objectContaining({ encrypt: expect.any(Function), decrypt: expect.any(Function) });

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
  searchEntries: jest.fn(),
};
MockedRepository.mockImplementation(() => mockRepo as any);

const bitacoraModule = buildBitacoraModule();
const app = buildTestApp([{ path: '/api/bitacora', router: bitacoraModule.router }]);

const USER_ID = 42;
const auth = bearer(signToken({ userId: USER_ID, username: 'TestUser' }));
const authKey = { Authorization: auth, 'X-Bitacora-Key': KEY_HEADER };
const today = new Date().toISOString().slice(0, 10);
const entry = { date: '2020-03-04', body: 'Private text', modified: '2026-10-31T10:00:00Z', version: 1 };

describe('Bitacora module — integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKeys.findKey.mockResolvedValue(storedKey);
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
      ['post', '/api/bitacora/search'],
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
      await request(app).get('/api/bitacora/entries/2020-03-04').set(authKey).send({ userId: 1 });
      expect(mockRepo.findEntry).toHaveBeenCalledWith(USER_ID, '2020-03-04', CIPHER);
    });
  });

  describe('route ordering (S4)', () => {
    it('GET /entries?month= reaches the month handler', async () => {
      mockRepo.listDates.mockResolvedValue(['2020-03-04']);
      const res = await request(app).get('/api/bitacora/entries?month=2020-03').set(authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ month: '2020-03', dates: ['2020-03-04'] });
      expect(mockRepo.findEntry).not.toHaveBeenCalled();
    });

    it('POST /entries/import reaches the import handler', async () => {
      mockRepo.importEntries.mockResolvedValue({ created: ['2020-03-04'], overwritten: [], skipped: [] });
      const res = await request(app)
        .post('/api/bitacora/entries/import')
        .set(authKey)
        .send({ entries: [{ date: '2020-03-04', body: 'x' }], onConflict: 'skip' });
      expect(res.status).toBe(200);
      expect(mockRepo.importEntries).toHaveBeenCalledWith(USER_ID, [{ date: '2020-03-04', body: 'x' }], 'skip', CIPHER);
    });

    it('GET /entries/:date/nearby reaches the nearby handler', async () => {
      mockRepo.findByMonthDays.mockResolvedValue([]);
      const res = await request(app).get('/api/bitacora/entries/2020-03-04/nearby').set(authKey);
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
      const res = await request(app).get('/api/bitacora/home/2020-03-04').set(authKey);
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Home loaded',
        data: { date: '2020-03-04', entry: null, previousDay: { date: '2020-03-03', written: false }, onThisDay: [] },
      });
    });

    it('GET /entries/:date → 404 envelope (A9)', async () => {
      mockRepo.findEntry.mockResolvedValue(null);
      const res = await request(app).get('/api/bitacora/entries/2020-03-04').set(authKey);
      expect(res.status).toBe(404);
      expect(res.body).toEqual({ success: false, message: 'Entry not found' });
    });

    it('PUT /entries/:date → 201 on create (A1)', async () => {
      mockRepo.saveEntry.mockResolvedValue({ kind: 'created', entry });
      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set(authKey)
        .send({ body: '  Private text  ', baseVersion: null });
      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(entry);
      expect(mockRepo.saveEntry).toHaveBeenCalledWith(USER_ID, '2020-03-04', 'Private text', null, CIPHER);
    });

    it('PUT /entries/:date → 409 with the stored entry (A3)', async () => {
      mockRepo.saveEntry.mockResolvedValue({ kind: 'conflict', entry: { ...entry, version: 3 } });
      const res = await request(app)
        .put('/api/bitacora/entries/2020-03-04')
        .set(authKey)
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
        .set(authKey)
        .send({ body: '   ', baseVersion: null });
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ success: false, message: 'Invalid request', errors: ['body must not be empty'] });
    });

    it.each(['2026-02-30', '2026-13-01', 'abc', '1899-12-31'])('GET /entries/%s → 400 (A8)', async (date) => {
      const res = await request(app).get(`/api/bitacora/entries/${date}`).set(authKey);
      expect(res.status).toBe(400);
    });

    it("accepts tomorrow's UTC date and rejects the day after (A8)", async () => {
      mockRepo.findEntry.mockResolvedValue(null);
      const plus = (days: number) => new Date(Date.parse(today) + days * 86400000).toISOString().slice(0, 10);
      const tomorrow = await request(app).get(`/api/bitacora/entries/${plus(1)}`).set(authKey);
      const later = await request(app).get(`/api/bitacora/entries/${plus(2)}`).set(authKey);
      expect(tomorrow.status).toBe(404);
      expect(later.status).toBe(400);
    });

    it('DELETE /entries/:date → 200 with purgeOn (T1)', async () => {
      mockRepo.moveToTrash.mockResolvedValue({ deletedAt: '2026-10-31T12:00:00Z' });
      const res = await request(app).delete('/api/bitacora/entries/2020-03-04').set(authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ date: '2020-03-04', purgeOn: '2026-11-30T12:00:00Z' });
    });

    it('GET /trash', async () => {
      mockRepo.listTrash.mockResolvedValue([]);
      const res = await request(app).get('/api/bitacora/trash').set(authKey);
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(mockRepo.listTrash).toHaveBeenCalledWith(USER_ID, CIPHER);
    });

    it('POST /trash/:date/restore without a body uses "fail"', async () => {
      mockRepo.restoreFromTrash.mockResolvedValue({ kind: 'restored', entry });
      const res = await request(app).post('/api/bitacora/trash/2020-03-04/restore').set(authKey);
      expect(res.status).toBe(200);
      expect(mockRepo.restoreFromTrash).toHaveBeenCalledWith(USER_ID, '2020-03-04', 'fail', CIPHER);
    });

    it('GET /entries?month=2026-13 → 400 (M2)', async () => {
      const res = await request(app).get('/api/bitacora/entries?month=2026-13').set(authKey);
      expect(res.status).toBe(400);
    });
  });

  describe('POST /search (C14, SPEC v1.10)', () => {
    it('returns the total, the offset and one snippet per day, scoped to the token user', async () => {
      mockRepo.searchEntries.mockResolvedValue({ total: 1, rows: [{ date: '2019-01-14', body: 'Back from Melgar at noon.' }] });
      const res = await request(app)
        .post('/api/bitacora/search')
        .set(authKey)
        .send({ q: 'melgar', userId: 1 });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: 'Search done',
        data: { total: 1, offset: 0, results: [{ date: '2019-01-14', snippet: 'Back from Melgar at noon.' }] },
      });
      expect(mockRepo.searchEntries).toHaveBeenCalledWith(USER_ID, ['melgar'], 50, 0, CIPHER);
    });

    it('rejects a bad query with 400 and never echoes it (N2)', async () => {
      const res = await request(app).post('/api/bitacora/search').set(authKey).send({ q: 'x' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain('"x"');
      expect(mockRepo.searchEntries).not.toHaveBeenCalled();
    });

    it('is not reachable with GET, so a query never travels in a URL', async () => {
      const res = await request(app).get('/api/bitacora/search?q=melgar').set(authKey);
      expect(res.status).toBe(404);
    });
  });

  describe('the diary key gate (SPEC v1.11 §3.5, K1, K4)', () => {
    const diaryRoutes: Array<[string, string]> = [
      ['get', '/api/bitacora/home/2020-03-04'],
      ['get', '/api/bitacora/entries/2020-03-04/nearby'],
      ['get', '/api/bitacora/entries/2020-03-04'],
      ['put', '/api/bitacora/entries/2020-03-04'],
      ['delete', '/api/bitacora/entries/2020-03-04'],
      ['get', '/api/bitacora/entries?month=2020-03'],
      ['post', '/api/bitacora/entries/import'],
      ['get', '/api/bitacora/trash'],
      ['post', '/api/bitacora/trash/2020-03-04/restore'],
      ['post', '/api/bitacora/search'],
    ];
    const touched = () =>
      Object.values(mockRepo).reduce((calls, fn) => calls + (fn as jest.Mock).mock.calls.length, 0);

    it.each(diaryRoutes)('%s %s without the header → 428 KEY_REQUIRED, nothing touched', async (method, path) => {
      const res = await (request(app) as any)[method](path).set('Authorization', auth).send({});
      expect(res.status).toBe(428);
      expect(res.body).toEqual({ success: false, message: 'KEY_REQUIRED' });
      expect(touched()).toBe(0);
    });

    it.each(diaryRoutes)('%s %s for an account without a key → 428 KEY_NOT_SET', async (method, path) => {
      mockKeys.findKey.mockResolvedValue(null);
      const res = await (request(app) as any)[method](path).set(authKey).send({});
      expect(res.status).toBe(428);
      expect(res.body).toEqual({ success: false, message: 'KEY_NOT_SET' });
      expect(touched()).toBe(0);
    });

    it.each(diaryRoutes)('%s %s with a wrong key → 403 KEY_WRONG, nothing read or written', async (method, path) => {
      const res = await (request(app) as any)[method](path)
        .set({ Authorization: auth, 'X-Bitacora-Key': toBase64url(randomBytes(32)) })
        .send({ body: 'Private text', baseVersion: null, q: 'melgar', entries: [{ date: '2020-03-04', body: 'x' }], onConflict: 'skip' });
      expect(res.status).toBe(403);
      expect(res.body).toEqual({ success: false, message: 'KEY_WRONG' });
      expect(touched()).toBe(0);
    });

    it('checks the token before the key (401 first, S1)', async () => {
      const res = await request(app).get('/api/bitacora/trash').set('X-Bitacora-Key', KEY_HEADER);
      expect(res.status).toBe(401);
      expect(mockKeys.findKey).not.toHaveBeenCalled();
    });

    it('a token without userId → 401 before any key lookup (D1)', async () => {
      const noUserId = bearer(require('jsonwebtoken').sign({ username: 'x' }, TEST_SECRET_KEY));
      const res = await request(app).get('/api/bitacora/trash').set({ Authorization: noUserId, 'X-Bitacora-Key': KEY_HEADER });
      expect(res.status).toBe(401);
      expect(mockKeys.findKey).not.toHaveBeenCalled();
    });

    it('looks up the key of the token user only (K7)', async () => {
      mockRepo.listTrash.mockResolvedValue([]);
      await request(app).get('/api/bitacora/trash').set(authKey).send({ userId: 1 });
      expect(mockKeys.findKey).toHaveBeenCalledWith(USER_ID);
    });
  });

  describe('the /key routes (C15–C17, K2, K6)', () => {
    it.each([
      ['get', '/api/bitacora/key'],
      ['post', '/api/bitacora/key'],
      ['put', '/api/bitacora/key'],
    ])('%s %s without a token → 401', async (method, path) => {
      const res = await (request(app) as any)[method](path).send({});
      expect(res.status).toBe(401);
    });

    it('GET /key → 404 KEY_NOT_SET, then the parameters once a key exists; no key header needed', async () => {
      mockKeys.findKey.mockResolvedValueOnce(null);
      const before = await request(app).get('/api/bitacora/key').set('Authorization', auth);
      const after = await request(app).get('/api/bitacora/key').set('Authorization', auth);
      expect(before.status).toBe(404);
      expect(before.body).toEqual({ success: false, message: 'KEY_NOT_SET' });
      expect(after.status).toBe(200);
      expect(after.body.data).toEqual({ kdf: 'PBKDF2-SHA256', iterations: 600000, salt: SALT });
    });

    it('POST /key → 201 with the parameters, then 409 on a second try', async () => {
      mockKeys.createKey.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      const send = () =>
        request(app).post('/api/bitacora/key').set(authKey).send({ iterations: 600000, salt: SALT });
      const first = await send();
      const second = await send();
      expect(first.status).toBe(201);
      expect(first.body.data).toEqual({ kdf: 'PBKDF2-SHA256', iterations: 600000, salt: SALT });
      expect(second.status).toBe(409);
      expect(mockKeys.createKey.mock.calls[0][0]).toBe(USER_ID);
    });

    it('PUT /key → 200 with the new parameters; a wrong current key → 403', async () => {
      const newSalt = toBase64url(randomBytes(16));
      const ok = await request(app)
        .put('/api/bitacora/key')
        .set({ ...authKey, 'X-Bitacora-New-Key': toBase64url(randomBytes(32)) })
        .send({ iterations: 600000, salt: newSalt });
      const wrong = await request(app)
        .put('/api/bitacora/key')
        .set({ Authorization: auth, 'X-Bitacora-Key': toBase64url(randomBytes(32)), 'X-Bitacora-New-Key': toBase64url(randomBytes(32)) })
        .send({ iterations: 600000, salt: newSalt });
      expect(ok.status).toBe(200);
      expect(ok.body.data).toEqual({ kdf: 'PBKDF2-SHA256', iterations: 600000, salt: newSalt });
      expect(wrong.status).toBe(403);
      expect(mockKeys.replaceKey).toHaveBeenCalledTimes(1);
    });

    it('never echoes a key in a response (N2)', async () => {
      mockKeys.createKey.mockResolvedValue(true);
      const res = await request(app).post('/api/bitacora/key').set(authKey).send({ iterations: 1, salt: 'x' });
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).not.toContain(KEY_HEADER);
    });
  });

  describe('a body that does not decrypt (K5)', () => {
    it('answers 500 with a generic message and logs no text', async () => {
      const { UndecryptableBodyError } = jest.requireActual('../../src/modules/bitacora/infrastructure/crypto/aes-gcm');
      mockRepo.findEntry.mockRejectedValue(new UndecryptableBodyError());
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const res = await request(app).get('/api/bitacora/entries/2020-03-04').set(authKey);
      expect(res.status).toBe(500);
      expect(res.body).toEqual({ success: false, message: 'Internal server error' });
      expect(errorSpy).toHaveBeenCalledWith('Bitacora getEntry failed:', 'An entry body cannot be decrypted');
      errorSpy.mockRestore();
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
        .set(authKey)
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
      const res = await request(app).get('/api/bitacora/trash').set(authKey);
      expect(res.status).toBe(500);
      expect(errorSpy).toHaveBeenCalledWith('Bitacora listTrash failed:', 'unknown error');
      errorSpy.mockRestore();
    });
  });
});
