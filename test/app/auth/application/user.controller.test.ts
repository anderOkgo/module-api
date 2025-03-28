import { Request, Response } from '../../../../src/helpers/middle.helper';
import { defaultUser, addUser, loginUser } from '../../../../src/app/auth/application/user.controller';
import { addUserService, loginUserService } from '../../../../src/app/auth/domain/services/index';
import { validateUser, validateLogin } from '../../../../src/app/auth/application/user.validation';

jest.mock('../../../../src/app/auth/domain/services/index'); // Mock the services
jest.mock('../../../../src/app/auth/application/user.validation'); // Mock the validation

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

    // Mock the validation to pass
    (validateUser as jest.Mock).mockReturnValue({ error: null });

    // Mock the addUserService function to resolve with success
    (addUserService as jest.Mock).mockResolvedValue({ message: user });

    // Simulate a request with a user object in the request body
    req.body = user;

    await addUser(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it('should respond with a 404 error for addUser when user is not added', async () => {
    // Mock the validation to pass
    (validateUser as jest.Mock).mockReturnValue({ error: null });

    // Mock the addUserService function to resolve with error
    (addUserService as jest.Mock).mockResolvedValue({ error: true, message: 'user error' });

    // Simulate a request with a user object in the request body
    req.body = { username: 'testuser' };

    await addUser(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith('user error');
  });

  it('should respond with a user when login is successful', async () => {
    // Define a sample login response object for testing
    const loginResponse = { token: 'testtoken' };

    // Mock the validation to pass
    (validateLogin as jest.Mock).mockReturnValue({ error: null });

    // Mock the loginUserService function to resolve with success
    (loginUserService as jest.Mock).mockResolvedValue(loginResponse);

    // Simulate a request with login credentials in the request body
    req.body = { username: 'testuser', password: 'testpassword' };

    await loginUser(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(loginResponse);
  });

  it('should respond with a 404 error for loginUser when user is not found', async () => {
    // Mock the validation to pass
    (validateLogin as jest.Mock).mockReturnValue({ error: null });

    // Mock the loginUserService function to resolve with error
    (loginUserService as jest.Mock).mockResolvedValue({ error: true, message: 'User not found' });

    // Simulate a request with login credentials in the request body
    req.body = { username: 'testuser', password: 'testpassword' };

    await loginUser(req as Request, res as Response);

    // Check if the response status and JSON have been called correctly for error
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith('User not found');
  });

  it('should respond with a message for defaultUser', async () => {
    await defaultUser(req as Request, res as Response);

    // Check if the response JSON has been called correctly with the expected message
    expect(res.json).toHaveBeenCalledWith({ msg: 'API Users Working' });
  });
});
