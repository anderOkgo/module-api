import request from 'supertest';
import server from '../src/server';
import { Database } from '../src/helpers/my.database.helper';
import { token } from '../src/helpers/token.helper';

// Mock the dependencies
jest.mock('../src/helpers/my.database.helper');
jest.mock('../src/helpers/token.helper', () => ({
  token: {
    verify: jest.fn(),
  },
}));

describe('Express Server', () => {
  let app: any;

  beforeAll(() => {
    // Mock database connection
    (Database.prototype.open as jest.Mock).mockResolvedValue(true);
    app = new server().app;
  });

  afterAll(() => {
    // Clean up any open handles
    jest.clearAllMocks();
  });

  // Test the root route
  it('should respond with status code 200 for the root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Test an API route (for example, /api/series)
  it('should respond with status code 401 for /api/series without auth token', async () => {
    // Mock token verification to fail
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    const response = await request(app).get('/api/series');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized: Missing or invalid token format',
    });
  });

  // Test /api/users route
  it('should respond with status code 401 for /api/users without auth token', async () => {
    // Mock token verification to fail
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    const response = await request(app).get('/api/users');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized: Missing or invalid token format',
    });
  });

  // Test /api/finan route
  it('should respond with status code 401 for /api/finan without auth token', async () => {
    // Mock token verification to fail
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    const response = await request(app).get('/api/finan');
    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: 'Unauthorized: Missing or invalid token format',
    });
  }, 30000);

  // Test with valid auth token
  it('should respond with status code 200 for /api/series with valid auth token', async () => {
    // Mock token verification to succeed
    (token.verify as jest.Mock).mockImplementation((token, secret, callback) => {
      callback(null, { username: 'testuser' });
    });

    const validToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFuZGVyb2tnbyIsImlhdCI6MTcxNDkzMDY1Nn0.Q28Pel7h5VcIo8B3tTF6Rpf-TIZTSrY8CWeVllaq08k';
    const response = await request(app).get('/api/series').set('Authorization', `Bearer ${validToken}`);
    expect(response.status).toBe(200);
  });
});
