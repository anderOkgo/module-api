import request from 'supertest';
import server from '../src/server'; // Import your Express server

const app = new server().app;

describe('Express Server', () => {
  // Test the root route
  it('should respond with status code 200 for the root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  // Test an API route (for example, /api/series)
  it('should respond with status code 200 for /api/series', async () => {
    const response = await request(app).get('/api/series');
    expect(response.status).toBe(200);
  });

  // Add more tests for other routes, middleware, and functionality as needed
});
