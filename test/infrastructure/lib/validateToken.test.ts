import { Request, Response, NextFunction } from '../../../src/infrastructure/middle.helper';
import validateToken from '../../../src/infrastructure/validate-token.helper';
import { token } from '../../../src/infrastructure/token.helper';

// Mock the token helper
jest.mock('../../../src/infrastructure/token.helper', () => ({
  token: {
    verify: jest.fn(),
  },
}));

describe('validateToken Middleware', () => {
  // Mock Express request, response, and next functions
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  type MockResponse = Partial<Response> & {
    status: jest.Mock<MockResponse>;
    json: jest.Mock<MockResponse>;
  };

  beforeEach(() => {
    // Create mock request, response, and next functions for each test
    req = {
      headers: {},
      body: {},
    };
    res = {
      status: jest.fn(() => res) as MockResponse['status'],
      json: jest.fn() as MockResponse['json'],
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should pass when a valid token is provided', async () => {
    // Mock a valid token
    const validToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFuZGVyb2tnbyIsImlhdCI6MTcxNDkzMDY1Nn0.Q28Pel7h5VcIo8B3tTF6Rpf-TIZTSrY8CWeVllaq08k';

    // Set the Authorization header with the valid token
    req.headers = { authorization: `Bearer ${validToken}` };

    // Mock token verification to succeed
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { username: 'anderokgo' });
    });

    await validateToken(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
    expect(req.body.username).toBe('anderokgo');
  });

  it('should return 401 when no token is provided', async () => {
    // Set no Authorization header
    req.headers = {};

    await validateToken(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token format is invalid', async () => {
    // Set an invalid token format
    req.headers = { authorization: 'InvalidToken' };

    await validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    // Mock an invalid token
    const invalidToken = 'invalid_token';

    // Set the Authorization header with the invalid token
    req.headers = { authorization: `Bearer ${invalidToken}` };

    // Mock token verification to fail
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    await validateToken(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle token verification errors', async () => {
    // Mock a token that will trigger an error during verification
    const errorToken = 'error_token';

    // Set the Authorization header with the error-triggering token
    req.headers = { authorization: `Bearer ${errorToken}` };

    // Mock token verification to throw an error
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Token verification error'), null);
    });

    await validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
