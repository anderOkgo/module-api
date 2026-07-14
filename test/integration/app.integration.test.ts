import request from 'supertest';
import { Router } from 'express';
import { buildTestApp } from './helpers/build-test-app';

/**
 * Cross-cutting behaviors shared by every route, mirrored from src/server.ts's
 * middleware/error-handler setup (see build-test-app.ts). Server.ts itself
 * isn't imported directly here because its constructor has real side effects
 * (opens a DB connection, calls app.listen()).
 */
describe('App-level integration', () => {
  const app = buildTestApp([]);

  it('returns 404 for an unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Not Found' });
  });

  it('returns 400 Bad Request for a malformed JSON body', async () => {
    const res = await request(app)
      .post('/api/anything')
      .set('Content-Type', 'application/json')
      .send('{ this is not valid json');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Bad Request: Invalid JSON' });
  });

  it('returns 500 Internal Server Error for any other unhandled error', async () => {
    const failingRouter = Router();
    failingRouter.get('/boom', () => {
      throw new Error('unexpected failure');
    });
    const failingApp = buildTestApp([{ path: '/api/failing', router: failingRouter }]);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation();

    const res = await request(failingApp).get('/api/failing/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'Internal Server Error' });

    errorSpy.mockRestore();
  });
});
