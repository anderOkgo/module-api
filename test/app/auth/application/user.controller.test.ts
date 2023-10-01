import { Request, Response } from '../../../../src/helpers/middle.helper';
import { defaultUsers, addUsers, loginUsers } from '../../../../src/app/auth/application/user.controller';
import { addUser, loginUser } from '../../../../src/app/auth/domain/services/index';

jest.mock('../../../../src/app/auth/domain/services/index'); // Mock the services

describe('User Controller', () => {
  const req: Partial<Request> = {};
  const res: Partial<Response> = {
    json: jest.fn(),
    status: jest.fn(() => res as Response), // Type assertion here
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should respond with a user when added successfully', async () => {
    // Define a sample user object for testing
    const user = { username: 'testuser' };

    // Mock the addUser function to resolve with the user
    (addUser as jest.Mock).mockResolvedValue(user);

    // Simulate a request with a user object in the request body
    req.body = user;

    await addUsers(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('should respond with a 404 error for addUser when user is not added', async () => {
    // Mock the addUser function to resolve with null (user not added)
    (addUser as jest.Mock).mockResolvedValue(null);

    // Simulate a request with a user object in the request body
    req.body = { username: 'testuser' };

    await addUsers(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'user error' });
  });

  it('should respond with a user when login is successful', async () => {
    // Define a sample login response object for testing
    const loginResponse = { userId: 1, token: 'testtoken' };

    // Mock the loginUser function to resolve with the login response
    (loginUser as jest.Mock).mockResolvedValue(loginResponse);

    // Simulate a request with login credentials in the request body
    req.body = { username: 'testuser', password: 'testpassword' };

    await loginUsers(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loginResponse);
  });

  it('should respond with a 404 error for loginUsers when user is not found', async () => {
    // Mock the loginUser function to resolve with null (user not found)
    (loginUser as jest.Mock).mockResolvedValue(null);

    // Simulate a request with login credentials in the request body
    req.body = { username: 'testuser', password: 'testpassword' };

    await loginUsers(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('should respond with a message for defaultUsers', async () => {
    await defaultUsers(req as Request, res as Response);

    // Check if the response JSON has been called correctly with the expected message
    expect(res.json).toHaveBeenCalledWith({ msg: 'API Users Working' });
  });
});
