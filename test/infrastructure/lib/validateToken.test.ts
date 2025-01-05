import { Request, Response, NextFunction } from '../../../src/infrastructure/middle.helper';
import validateToken from '../../../src/infrastructure/validate-token.helper';
import { token } from '../../../src/infrastructure/token.helper';

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
    };
    res = {
      status: jest.fn(() => res) as MockResponse['status'], // Explicitly type the status function
      json: jest.fn() as MockResponse['json'], // Explicitly type the json function
    };
    next = jest.fn();
  });
  beforeEach(() => {
    // Reset mock function calls before each test
    jest.clearAllMocks();
  });

  it('should pass when a valid token is provided', () => {
    // Mock a valid token
    const validToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmaXJzdF9uYW1lIjoiYW5kZXJva2dvIiwiaWF0IjoxNzE0OTMwNjU2fQ.Q28Pel7h5VcIo8B3tTF6Rpf-TIZTSrY8CWeVllaq08k';

    // Set the Authorization header with the valid token
    req.headers = { authorization: `Bearer ${validToken}` };

    validateToken(req as Request, res as Response, next as NextFunction);

    expect(next).toHaveBeenCalled();
  });

  it('should return 401 when no token is provided', () => {
    // Set no Authorization header
    req.headers = {};

    validateToken(req as Request, res as Response, next as NextFunction);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token format is invalid', () => {
    // Set an invalid token format
    req.headers = { authorization: 'InvalidToken' };

    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Missing or invalid token format',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', () => {
    // Mock an invalid token
    const invalidToken = 'invalid_token';

    // Set the Authorization header with the invalid token
    req.headers = { authorization: `Bearer ${invalidToken}` };

    validateToken(req as Request, res as Response, next as NextFunction);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized: Invalid token',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should handle token verification errors', () => {
    // Mock a token that will trigger an error during verification
    const errorToken = 'error_token';

    // Set the Authorization header with the error-triggering token
    req.headers = { authorization: `Bearer ${errorToken}` };

    // Mock token verification function to throw an error
    token.verify = jest.fn(() => {
      throw new Error('Token verification error');
    });

    validateToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal Server Error',
    });
    expect(next).not.toHaveBeenCalled();
  });
});
