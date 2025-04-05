import request from 'supertest';
import Server from '../src/server';
import { Database } from '../src/infrastructure/my.database.helper';
import { token } from '../src/infrastructure/token.helper';
import { Application, NextFunction, Request, Response } from 'express';

// Mock the dependencies
jest.mock('../src/infrastructure/my.database.helper');
jest.mock('../src/infrastructure/token.helper');
jest.mock('../src/infrastructure/cors.helper', () => ({
  cors: jest.fn(() => (req: any, res: any, next: any) => next()),
}));

// Mock validateToken middleware
jest.mock('../src/infrastructure/validate-token.helper', () =>
  jest.fn().mockImplementation((req, res, next) => {
    if (!req.headers.authorization) {
      return res.status(401).json({
        error: 'Unauthorized: Missing or invalid token format',
      });
    }

    // The actual validation is handled by token.verify mock in the tests
    if (req.headers.authorization.startsWith('Bearer ')) {
      next();
    } else {
      return res.status(401).json({
        error: 'Unauthorized: Missing or invalid token format',
      });
    }
  })
);

// Mock route files to prevent router initialization errors
jest.mock('../src/modules/series/application/series.routes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../src/modules/auth/application/user.routes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../src/modules/finan/application/finan.routes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../src/modules/default/application/default.routes', () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock the middleware helper
jest.mock('../src/infrastructure/middle.helper', () => {
  // Create mock response methods
  const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };

  // Create mock request
  const mockRequest = {
    headers: {},
    body: {},
    params: {},
    query: {},
    on: jest.fn(),
  };

  // Create a router that captures routes
  const mockRouter = {
    get: jest.fn().mockReturnThis(),
    post: jest.fn().mockReturnThis(),
    put: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    use: jest.fn().mockReturnThis(),
    all: jest.fn().mockReturnThis(),
  };

  // Create an app instance
  const mockApp = {
    use: jest.fn().mockReturnThis(),
    get: jest.fn().mockImplementation((path, handler) => {
      // Store the handler to execute it in tests
      mockApp._routes.get[path] = handler;
      return mockApp;
    }),
    post: jest.fn().mockImplementation((path, handler) => {
      mockApp._routes.post[path] = handler;
      return mockApp;
    }),
    put: jest.fn().mockImplementation((path, handler) => {
      mockApp._routes.put[path] = handler;
      return mockApp;
    }),
    delete: jest.fn().mockImplementation((path, handler) => {
      mockApp._routes.delete[path] = handler;
      return mockApp;
    }),
    all: jest.fn().mockImplementation((path, handler) => {
      mockApp._routes.all[path] = handler;
      return mockApp;
    }),
    listen: jest.fn().mockImplementation((port, callback) => {
      if (callback) callback();
      return mockApp;
    }),
    set: jest.fn().mockReturnThis(),

    // Store routes for testing
    _routes: {
      get: {},
      post: {},
      put: {},
      delete: {},
      all: {},
      use: [],
    },

    // Execute handler with mock req/res
    _executeRoute: (method, path, req = mockRequest, res = mockResponse) => {
      const handler = mockApp._routes[method][path];
      if (handler) {
        return handler(req, res);
      }
      return null;
    },
  };

  // Create middleware and handler functions
  const jsonMiddleware = (req: any, res: any, next: any) => {
    // Mock JSON parsing
    if (req.headers['content-type'] === 'application/json') {
      try {
        if (typeof req.body === 'string') {
          req.body = JSON.parse(req.body);
        }
        next();
      } catch (e) {
        res.status(400).json({ error: 'Bad Request: Invalid JSON' });
      }
    } else {
      next();
    }
  };

  // Create the mock express function
  type MockExpressType = jest.Mock & {
    json: jest.Mock;
  };

  const mockExpress = jest.fn(() => mockApp) as MockExpressType;

  // Add json method to mockExpress
  mockExpress.json = jest.fn(() => jsonMiddleware);

  return {
    express: mockExpress,
    router: jest.fn(() => mockRouter),
    Application: jest.fn(),
    Request: jest.fn(),
    Response: jest.fn(),
    NextFunction: jest.fn(),
    // Export helpers for testing
    _mockApp: mockApp,
    _mockRequest: mockRequest,
    _mockResponse: mockResponse,
  };
});

// Mock controller methods
jest.mock('../src/modules/finan/application/finan.controller', () => ({
  defaultFInan: jest.fn((req, res) => res.json({ msg: 'API Finan Working' })),
  getInitialLoad: jest.fn((req, res) => res.json({ msg: 'Initial load' })),
  putMovement: jest.fn((req, res) => res.json({ msg: 'Put movement' })),
  updateMovement: jest.fn((req, res) => res.json({ msg: 'Update movement' })),
  deleteMovement: jest.fn((req, res) => res.json({ msg: 'Delete movement' })),
}));

// Mock server's listening method
jest.mock('../src/server', () => {
  const originalModule = jest.requireActual('../src/server');

  return {
    __esModule: true,
    default: class MockedServer extends originalModule.default {
      constructor() {
        super();
        // Override the listening method to do nothing
        this.listening = jest.fn();
      }
    },
  };
});

describe('Server Class', () => {
  let server: Server;
  let app: Application;
  const middleHelper = jest.requireMock('../src/infrastructure/middle.helper');
  const mockResponse = middleHelper._mockResponse;

  beforeAll(() => {
    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Reset response mocks
    mockResponse.status.mockReturnThis();
    mockResponse.json.mockReturnThis();

    // Mock database connection
    (Database.prototype.open as jest.Mock).mockResolvedValue(true);

    // Create a server instance
    server = new Server();
    app = server.app;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should initialize with default port 3000', () => {
      const originalPort = process.env.PORT;
      delete process.env.PORT;

      const testServer = new Server();

      expect(testServer.app).toBeDefined();
      expect(testServer['port']).toBe('3000');

      // Restore env
      process.env.PORT = originalPort;
    });

    it('should initialize with custom port from environment', () => {
      const originalPort = process.env.PORT;
      process.env.PORT = '4000';

      const testServer = new Server();

      expect(testServer.app).toBeDefined();
      expect(testServer['port']).toBe('4000');

      // Restore env
      process.env.PORT = originalPort;
    });

    it('should call middleware setup methods', () => {
      // Get references to the Express middleware functions
      const expressMiddleware = middleHelper.express().use;
      const expressJson = middleHelper.express.json;

      // Verify middleware setup was called
      expect(expressMiddleware).toHaveBeenCalled();
      expect(expressJson).toHaveBeenCalled();
    });

    it('should set up routes', () => {
      // Get reference to the Express use method
      const expressUse = middleHelper.express().use;

      // Verify routes were set up
      expect(expressUse).toHaveBeenCalledWith('/', expect.anything());
      expect(expressUse).toHaveBeenCalledWith('/api', expect.anything());
      expect(expressUse).toHaveBeenCalledWith('/api/series', expect.anything());
      expect(expressUse).toHaveBeenCalledWith('/api/users', expect.anything());
      expect(expressUse).toHaveBeenCalledWith('/api/finan', expect.anything());
    });
  });

  describe('Database Connection', () => {
    it('should connect successfully to database', async () => {
      await server['connectDB']();

      expect(Database.prototype.open).toHaveBeenCalled();
      expect(Database.prototype.constructor).toHaveBeenCalledWith('MYDATABASEANIME');
    });

    it('should exit process if database connection fails', async () => {
      const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      (Database.prototype.open as jest.Mock).mockRejectedValueOnce(new Error('Connection failed'));

      await server['connectDB']();

      expect(console.error).toHaveBeenCalledWith('Database connection failed', expect.any(Error));
      expect(mockExit).toHaveBeenCalledWith(1);

      mockExit.mockRestore();
    });
  });

  describe('Error Handler Middleware', () => {
    it('should handle JSON syntax errors', () => {
      const err = new SyntaxError('Unexpected token');
      Object.defineProperty(err, 'body', { value: {} });

      server['errorHandlerMiddleware'](err, {} as Request, mockResponse as any, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Bad Request: Invalid JSON',
      });
    });

    it('should handle 404 errors', () => {
      const err = new Error('Not Found');

      server['errorHandlerMiddleware'](err, {} as Request, mockResponse as any, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Not Found',
      });
    });

    it('should handle Method Not Allowed errors', () => {
      const err = new Error('Method Not Allowed');

      server['errorHandlerMiddleware'](err, {} as Request, mockResponse as any, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(405);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Method Not Allowed',
      });
    });

    it('should handle generic internal server errors', () => {
      const err = new Error('Some unexpected error');

      server['errorHandlerMiddleware'](err, {} as Request, mockResponse as any, jest.fn());

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Internal Server Error',
      });
      expect(console.error).toHaveBeenCalledWith('Internal Server Error:', err);
    });
  });

  describe('Server Listening', () => {
    it('should call listen with the configured port', () => {
      const listenSpy = jest.spyOn(server.app, 'listen');

      server['listening']();

      expect(listenSpy).toHaveBeenCalledWith(server['port'], expect.any(Function));
    });
  });

  describe('Middleware Setup', () => {
    it('should apply JSON middleware', () => {
      const jsonSpy = jest.spyOn(middleHelper.express, 'json');
      const useSpy = jest.spyOn(app, 'use');

      server['middlewares']();

      expect(jsonSpy).toHaveBeenCalled();
      expect(useSpy).toHaveBeenCalled();
    });
  });

  describe('Routes Setup', () => {
    it('should apply CORS middleware', () => {
      const { cors } = require('../src/infrastructure/cors.helper');
      const useSpy = jest.spyOn(app, 'use');

      server['routes']();

      expect(cors).toHaveBeenCalledWith({ origin: '*' });
      expect(useSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set up all route modules', () => {
      const useSpy = jest.spyOn(app, 'use');
      const defaultRoutes = require('../src/modules/default/application/default.routes').default;
      const seriesRoutes = require('../src/modules/series/application/series.routes').default;
      const userRoutes = require('../src/modules/auth/application/user.routes').default;
      const finanRoutes = require('../src/modules/finan/application/finan.routes').default;

      server['routes']();

      expect(useSpy).toHaveBeenCalledWith('/', defaultRoutes);
      expect(useSpy).toHaveBeenCalledWith('/api', defaultRoutes);
      expect(useSpy).toHaveBeenCalledWith('/api/series', seriesRoutes);
      expect(useSpy).toHaveBeenCalledWith('/api/users', userRoutes);
      expect(useSpy).toHaveBeenCalledWith('/api/finan', finanRoutes);
      expect(useSpy).toHaveBeenCalledWith(expect.any(Function)); // Error handler
    });

    it('should apply error handler middleware last', () => {
      const useSpy = jest.spyOn(app, 'use');

      server['routes']();

      // The last call should be the error handler
      const calls = useSpy.mock.calls;
      const lastCall = calls[calls.length - 1];
      expect(lastCall[0]).toBe(server['errorHandlerMiddleware']);
    });
  });
});
