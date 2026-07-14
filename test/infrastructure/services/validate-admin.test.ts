import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import validateAdmin from '../../../src/infrastructure/services/validate-admin';

// This middleware is also exercised end-to-end by test/integration/series.integration.test.ts
// (missing token -> 401, valid non-admin token -> 403, valid admin token -> success). This
// suite fills in the edge cases that integration testing alone didn't reach: malformed
// headers, invalid signatures, tokens missing required claims, and the synchronous-throw path.
const SECRET = 'validate-admin-test-secret';

describe('validateAdmin middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    process.env.SECRET_KEY = SECRET;
    req = { headers: {}, body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
    next = jest.fn();
  });

  it('rejects when there are no headers at all', () => {
    req.headers = undefined as any;

    validateAdmin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects when the authorization header is missing', () => {
    validateAdmin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects a header that does not start with "Bearer "', () => {
    req.headers = { authorization: 'Token abc123' };

    validateAdmin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized: Missing or invalid token format' });
    expect(next).not.toHaveBeenCalled();
  });

  it('rejects an invalid/malformed token', (done) => {
    req.headers = { authorization: 'Bearer not-a-real-token' };
    (res.json as jest.Mock).mockImplementation((body) => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(body).toEqual({ error: 'Unauthorized: Invalid token' });
      expect(next).not.toHaveBeenCalled();
      done();
      return res;
    });

    validateAdmin(req as Request, res as Response, next);
  });

  it('rejects a validly-signed token missing role/username claims', (done) => {
    const token = jwt.sign({ foo: 'bar' }, SECRET);
    req.headers = { authorization: `Bearer ${token}` };
    (res.json as jest.Mock).mockImplementation((body) => {
      expect(res.status).toHaveBeenCalledWith(401);
      expect(body).toEqual({ error: 'Unauthorized: Invalid token payload' });
      expect(next).not.toHaveBeenCalled();
      done();
      return res;
    });

    validateAdmin(req as Request, res as Response, next);
  });

  it('rejects a valid token whose role is not admin', (done) => {
    const token = jwt.sign({ userId: 1, username: 'user', role: 2 }, SECRET);
    req.headers = { authorization: `Bearer ${token}` };
    (res.json as jest.Mock).mockImplementation((body) => {
      expect(res.status).toHaveBeenCalledWith(403);
      expect(body.error).toBe('Forbidden: Admin role required');
      expect(next).not.toHaveBeenCalled();
      done();
      return res;
    });

    validateAdmin(req as Request, res as Response, next);
  });

  it('accepts role === 1 as admin and forwards user info onto req.body', (done) => {
    const token = jwt.sign({ userId: 7, username: 'admin1', role: 1 }, SECRET);
    req.headers = { authorization: `Bearer ${token}` };
    (next as jest.Mock) = jest.fn(() => {
      expect(req.body).toEqual(expect.objectContaining({ username: 'admin1', userRole: 1, userId: 7 }));
      done();
    });

    validateAdmin(req as Request, res as Response, next);
  });

  it('accepts role === "admin" (string) as admin', (done) => {
    const token = jwt.sign({ userId: 7, username: 'admin2', role: 'admin' }, SECRET);
    req.headers = { authorization: `Bearer ${token}` };
    (next as jest.Mock) = jest.fn(() => {
      expect(req.body.userRole).toBe('admin');
      done();
    });

    validateAdmin(req as Request, res as Response, next);
  });

  it('falls back to the default secret when SECRET_KEY is unset', (done) => {
    delete process.env.SECRET_KEY;
    const token = jwt.sign({ userId: 1, username: 'admin1', role: 1 }, 'qwertgfdsa');
    req.headers = { authorization: `Bearer ${token}` };
    (next as jest.Mock) = jest.fn(() => {
      expect(req.body.username).toBe('admin1');
      process.env.SECRET_KEY = SECRET;
      done();
    });

    validateAdmin(req as Request, res as Response, next);
  });

  it('returns 500 when jwt.verify throws synchronously', () => {
    const verifySpy = jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('unexpected verify failure');
    });
    req.headers = { authorization: 'Bearer whatever' };

    validateAdmin(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    expect(next).not.toHaveBeenCalled();

    verifySpy.mockRestore();
  });
});
