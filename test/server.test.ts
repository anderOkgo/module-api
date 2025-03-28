import request from 'supertest';
import Server from '../src/server';
import { Database } from '../src/infrastructure/my.database.helper';
import { token } from '../src/infrastructure/token.helper';
import { Application } from 'express';

// Mock the dependencies
jest.mock('../src/infrastructure/my.database.helper');
jest.mock('../src/infrastructure/token.helper');
jest.mock('../src/infrastructure/cors.helper', () => ({
  cors: () => (req: any, res: any, next: any) => next(),
}));

describe('Express Server', () => {
  let app: Application;
  let server: Server;
  const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6MX0.abc123';

  beforeAll(() => {
    // Suppress console output during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Mock Database connection
    (Database.prototype.open as jest.Mock).mockResolvedValue(true);

    // Create server instance
    server = new Server();
    app = server.app;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Server Initialization', () => {
    it('should initialize with default port 3000', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = undefined;
      const testServer = new Server();
      expect(testServer.app).toBeDefined();
      process.env.PORT = originalPort;
    });

    it('should initialize with custom port', () => {
      process.env.PORT = '4000';
      const testServer = new Server();
      expect(testServer.app).toBeDefined();
    });
  });

  describe('Database Connection', () => {
    it('should connect successfully', async () => {
      const testServer = new Server();
      await testServer['connectDB']();
      expect(Database.prototype.open).toHaveBeenCalled();
    });

    it('should handle connection failure', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      (Database.prototype.open as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      const testServer = new Server();
      await testServer['connectDB']();

      expect(mockExit).toHaveBeenCalledWith(1);
      mockExit.mockRestore();
    });
  });

  describe('Route Handlers', () => {
    describe('Public Routes', () => {
      it('should respond 200 for /', async () => {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
      });

      it('should respond 200 for /api', async () => {
        const response = await request(app).get('/api');
        expect(response.status).toBe(200);
      });
    });

    describe('Protected Routes', () => {
      const protectedRoutes = ['/api/series', '/api/users', '/api/finan'];

      beforeEach(() => {
        // Default token verification behavior
        (token.verify as jest.Mock).mockImplementation((_, __, callback) => {
          callback(new Error('Invalid token'), null);
        });
      });

      protectedRoutes.forEach((route) => {
        it(`should require auth token for ${route}`, async () => {
          const response = await request(app).get(route);
          expect(response.status).toBe(401);
          expect(response.body).toEqual({
            error: 'Unauthorized: Missing or invalid token format',
          });
        });

        it(`should reject invalid token for ${route}`, async () => {
          const response = await request(app).get(route).set('Authorization', 'Bearer invalid.token');

          expect(response.status).toBe(401);
          expect(response.body).toEqual({
            error: 'Unauthorized: Invalid token',
          });
        });

        it(`should accept valid token for ${route}`, async () => {
          // Mock successful token verification
          (token.verify as jest.Mock).mockImplementation((_, __, callback) => {
            callback(null, { username: 'testuser', role: 1 });
          });

          const response = await request(app).get(route).set('Authorization', `Bearer ${validToken}`);

          expect(response.status).toBe(200);
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{invalid json}');

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: 'Bad Request: Invalid JSON',
      });
    });

    it('should handle 404 errors', async () => {
      const response = await request(app).get('/nonexistent-route');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: 'Not Found',
      });
    });

    it('should handle method not allowed', async () => {
      // Mock successful token verification for this test
      (token.verify as jest.Mock).mockImplementation((_, __, callback) => {
        callback(null, { username: 'testuser', role: 1 });
      });

      const response = await request(app).post('/api').set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        error: 'Method Not Allowed',
      });
    });

    it('should handle internal server errors', async () => {
      // Add a route that throws an error
      app.get('/test-error', () => {
        throw new Error('Test internal error');
      });

      const response = await request(app).get('/test-error');
      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: 'Internal Server Error',
      });
    });
  });
});
