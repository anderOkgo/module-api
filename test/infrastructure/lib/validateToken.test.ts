import { Request, Response, NextFunction } from 'express';
import validateToken from '../../../src/infrastructure/services/validate-token';
import jwt from 'jsonwebtoken';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('validateToken Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Create fresh mocks for each test
    req = {
      headers: {},
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();

    // Spy on console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should return 401 when no authorization header is present', () => {
    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header does not start with Bearer', () => {
    req.headers = { authorization: 'Invalid token' };

    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next() and set username when token is valid', () => {
    process.env.SECRET_KEY = 'validate-token-test-secret';
    req.headers = { authorization: 'Bearer valid.token' };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { username: 'testuser' });
    });

    validateToken(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith('valid.token', 'validate-token-test-secret', expect.any(Function));
    expect(req.body.username).toBe('testuser');
    expect(req.body.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should also set userId when the token carries a numeric userId', () => {
    process.env.SECRET_KEY = 'validate-token-test-secret';
    req.headers = { authorization: 'Bearer valid.token' };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { userId: 42, username: 'TestUser', role: 'user' });
    });

    validateToken(req as Request, res as Response, next);

    expect(req.body.userId).toBe(42);
    expect(req.body.username).toBe('TestUser');
    expect(next).toHaveBeenCalled();
  });

  it('should not set userId when the token userId is not a number', () => {
    process.env.SECRET_KEY = 'validate-token-test-secret';
    req.headers = { authorization: 'Bearer valid.token' };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { userId: '42', username: 'testuser' });
    });

    validateToken(req as Request, res as Response, next);

    expect(req.body.userId).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('should drop a client-sent userId when the token has no numeric userId', () => {
    process.env.SECRET_KEY = 'validate-token-test-secret';
    req.headers = { authorization: 'Bearer valid.token' };
    req.body = { userId: 7, username: 'spoofed' };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { username: 'testuser' });
    });

    validateToken(req as Request, res as Response, next);

    expect(req.body.userId).toBeUndefined();
    expect(req.body.username).toBe('testuser');
    expect(next).toHaveBeenCalled();
  });

  it('should override a client-sent userId with the token userId', () => {
    process.env.SECRET_KEY = 'validate-token-test-secret';
    req.headers = { authorization: 'Bearer valid.token' };
    req.body = { userId: 7 };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { userId: 42, username: 'testuser' });
    });

    validateToken(req as Request, res as Response, next);

    expect(req.body.userId).toBe(42);
    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when token verification fails', () => {
    req.headers = { authorization: 'Bearer invalid.token' };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Token verification failed'), null);
    });

    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('JWT verification failed:', expect.any(Error));
  });

  it('should return 401 when decoded token payload is invalid', () => {
    req.headers = { authorization: 'Bearer invalid.payload.token' };

    (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { invalidPayload: true });
    });

    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token payload',
    });
    expect(next).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid token payload:', { invalidPayload: true });
  });

  it('should return 500 when token verification throws an error', () => {
    req.headers = { authorization: 'Bearer error.token' };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
    expect(next).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith('Token verification error:', expect.any(Error));
  });
});
