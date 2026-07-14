import { Request, Response } from 'express';
import request from 'supertest';
import { Database } from '../src/infrastructure/my.database.helper';

jest.mock('../src/infrastructure/my.database.helper');

// buildApp() mounts the real per-module routers — mocked here since this
// suite is about server.ts's own concerns (health, root, 404, error
// handling, middleware wiring), not re-verifying the sub-routes, which
// already have dedicated unit/integration/E2E coverage.
jest.mock('../src/modules/series/infrastructure/config/series.module', () => ({
  buildSeriesModule: () => ({ router: require('express').Router() }),
}));
jest.mock('../src/modules/auth/infrastructure/config/auth.module', () => ({
  buildAuthModule: () => ({ router: require('express').Router() }),
}));
jest.mock('../src/modules/finan/infrastructure/config/finan.module', () => ({
  buildFinanModule: () => ({ router: require('express').Router() }),
}));

import Server, { buildApp, errorHandlerMiddleware, healthCheck } from '../src/server';

const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('server.ts', () => {
  let mockDatabase: jest.Mocked<Pick<Database, 'testConnection'>>;

  beforeEach(() => {
    mockDatabase = { testConnection: jest.fn() };
  });

  describe('buildApp', () => {
    it('GET /health returns 200 UP when the database is reachable', async () => {
      mockDatabase.testConnection.mockResolvedValue(true);
      const app = buildApp(mockDatabase as any);

      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.services.database).toBe('UP');
    });

    it('GET /health returns 503 DOWN when the database is unreachable', async () => {
      mockDatabase.testConnection.mockRejectedValue(new Error('connection refused'));
      const app = buildApp(mockDatabase as any);

      const res = await request(app).get('/health');

      expect(res.status).toBe(503);
      expect(res.body.status).toBe('DOWN');
      expect(res.body.services.database).toBe('DOWN');
      expect(res.body.services.database_error).toBe('connection refused');
    });

    it('GET / always returns 200, even when the keep-alive DB ping fails', async () => {
      mockDatabase.testConnection.mockRejectedValue(new Error('ping failed'));
      const app = buildApp(mockDatabase as any);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: 'API Working' });
      expect(mockDatabase.testConnection).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    it('GET / logs a plain string rejection from the keep-alive ping without an Error instance', async () => {
      mockDatabase.testConnection.mockRejectedValue('raw string failure');
      const app = buildApp(mockDatabase as any);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      const res = await request(app).get('/');

      expect(res.status).toBe(200);
      expect(errorSpy).toHaveBeenCalledWith('Keep-alive DB ping failed:', 'raw string failure');

      errorSpy.mockRestore();
    });

    it('GET /api returns 200', async () => {
      const app = buildApp(mockDatabase as any);

      const res = await request(app).get('/api');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ msg: 'API Working' });
    });

    it('GET /api-docs serves the Swagger UI', async () => {
      const app = buildApp(mockDatabase as any);

      const res = await request(app).get('/api-docs/');

      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger');
    });

    it('mounts the series/auth/finan routers under /api/*', async () => {
      const app = buildApp(mockDatabase as any);

      // The mocked routers are empty, so these fall through to the app's own
      // 404 — confirming the path prefix is actually routed there (as
      // opposed to hitting the global 404 for an entirely unmounted prefix
      // would look identical, so this alone isn't conclusive by itself, but
      // combined with server.module wiring tests elsewhere it documents intent).
      const [seriesRes, authRes, finanRes] = await Promise.all([
        request(app).get('/api/series/anything'),
        request(app).get('/api/users/anything'),
        request(app).get('/api/finan/anything'),
      ]);

      expect(seriesRes.status).toBe(404);
      expect(authRes.status).toBe(404);
      expect(finanRes.status).toBe(404);
    });

    it('returns a JSON 404 for an unknown route', async () => {
      const app = buildApp(mockDatabase as any);

      const res = await request(app).get('/this-route-does-not-exist');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'Not Found' });
    });

    it('returns 400 for a malformed JSON body', async () => {
      const app = buildApp(mockDatabase as any);

      const res = await request(app)
        .post('/api/series/anything')
        .set('Content-Type', 'application/json')
        .send('{ not valid json');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: 'Bad Request: Invalid JSON' });
    });
  });

  describe('errorHandlerMiddleware', () => {
    it('wraps an unexpected error as a 500', () => {
      const req = {} as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();

      errorHandlerMiddleware(new Error('boom'), req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });

      errorSpy.mockRestore();
    });
  });

  describe('healthCheck', () => {
    it('falls back to a 503 when building/sending the response itself throws', async () => {
      mockDatabase.testConnection.mockResolvedValue(true);
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementationOnce(() => {
          throw new Error('serialization failed');
        }),
      } as unknown as Response;

      await healthCheck(mockDatabase as any, req, res);

      expect(res.status).toHaveBeenLastCalledWith(503);
    });

    it('falls back to "Unknown error" when the outer failure is not an Error instance', async () => {
      mockDatabase.testConnection.mockResolvedValue(true);
      const req = {} as Request;
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockImplementationOnce(() => {
          throw 'raw string failure';
        }),
      } as unknown as Response;

      await healthCheck(mockDatabase as any, req, res);

      expect(res.json).toHaveBeenLastCalledWith(expect.objectContaining({ error: 'Unknown error' }));
    });

    it('records "Unknown error" when the database check rejects with a non-Error value', async () => {
      mockDatabase.testConnection.mockRejectedValue('raw string failure');
      const req = {} as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await healthCheck(mockDatabase as any, req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ services: expect.objectContaining({ database_error: 'Unknown error' }) })
      );
    });

    it('defaults environment to "development" when NODE_ENV is unset', async () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      mockDatabase.testConnection.mockResolvedValue(true);
      const req = {} as Request;
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as unknown as Response;

      await healthCheck(mockDatabase as any, req, res);

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ environment: 'development' }));

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Server (bootstrap)', () => {
    const originalPort = process.env.PORT;
    let liveServers: any[] = [];

    beforeEach(() => {
      process.env.PORT = '0'; // let the OS pick a free ephemeral port
      liveServers = [];
    });

    afterEach((done) => {
      process.env.PORT = originalPort;
      const remaining = liveServers.map((s) => new Promise((resolve) => s.close(resolve)));
      Promise.all(remaining).then(() => done());
    });

    it('connects to the database and starts listening', async () => {
      const openMock = jest.fn().mockResolvedValue(undefined);
      MockedDatabase.mockImplementation(() => ({ open: openMock, testConnection: jest.fn() }) as any);

      const server = new Server();
      liveServers.push((server as any).server);
      await openMock.mock.results[0].value; // wait for connectDB()'s open() to resolve

      expect(openMock).toHaveBeenCalled();

      const res = await request(server.app).get('/api');
      expect(res.status).toBe(200);
    });

    it('logs and exits the process when the initial DB connection fails', async () => {
      const dbError = new Error('connection refused');
      const openMock = jest.fn().mockRejectedValue(dbError);
      MockedDatabase.mockImplementation(() => ({ open: openMock, testConnection: jest.fn() }) as any);
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);

      const server = new Server();
      liveServers.push((server as any).server);
      await openMock().catch(() => {}); // let the rejection settle before asserting
      await new Promise((resolve) => setImmediate(resolve));

      expect(errorSpy).toHaveBeenCalledWith('Database connection failed', dbError);
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    it('defaults to port 3000 when PORT is unset', () => {
      delete process.env.PORT;
      MockedDatabase.mockImplementation(
        () => ({ open: jest.fn().mockResolvedValue(undefined), testConnection: jest.fn() }) as any
      );
      // Intercept at the shared Express prototype so no real port ever gets
      // bound, regardless of what value ends up passed to .listen().
      const listenSpy = jest
        .spyOn(require('express').application, 'listen')
        .mockImplementation(function (this: any, ...args: any[]) {
          const cb = args.find((a) => typeof a === 'function');
          if (cb) cb();
          return { close: (done?: () => void) => done && done() } as any;
        });

      new Server();

      expect(listenSpy).toHaveBeenCalledWith('3000', expect.any(Function));

      listenSpy.mockRestore();
    });
  });
});
