import { Request, Response, NextFunction } from '../../../../src/infrastructure/middle.helper';
import { defaultUser, addUser, loginUser } from '../../../../src/modules/auth/application/user.controller';
import { addUserService, loginUserService } from '../../../../src/modules/auth/domain/services/index';
import { validateUser, validateLogin } from '../../../../src/modules/auth/application/user.validation';

// Mock the dependencies
jest.mock('../../../../src/modules/auth/domain/services/index', () => ({
  addUserService: jest.fn(),
  loginUserService: jest.fn(),
}));
jest.mock('../../../../src/modules/auth/application/user.validation');

describe('User Controller', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should respond with a user when added successfully', async () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
    };

    // Mock validation to pass
    (validateUser as jest.Mock).mockReturnValue({ error: false, data: user });
    // Mock service to return success
    (addUserService as jest.Mock).mockResolvedValue({ error: false, message: 'User created successfully' });

    // Simulate a request with a user object in the request body
    req.body = user;

    await addUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith('User created successfully');
  });

  it('should respond with a 404 error for addUser when user is not added', async () => {
    const user = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
    };

    // Mock validation to pass
    (validateUser as jest.Mock).mockReturnValue({ error: false, data: user });
    // Mock service to return error
    (addUserService as jest.Mock).mockResolvedValue({ error: true, message: 'User already exists' });

    // Simulate a request with a user object in the request body
    req.body = user;

    await addUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith('User already exists');
  });

  it('should respond with a token when login is successful', async () => {
    const login = {
      username: 'testuser',
      password: 'testpassword',
    };

    // Mock validation to pass
    (validateLogin as jest.Mock).mockReturnValue({ error: false, data: login });
    // Mock service to return success
    (loginUserService as jest.Mock).mockResolvedValue({ error: false, token: 'testtoken' });

    // Simulate a request with login credentials in the request body
    req.body = login;

    await loginUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: 'testtoken' });
  });

  it('should respond with a 404 error for loginUser when user is not found', async () => {
    const login = {
      username: 'testuser',
      password: 'testpassword',
    };

    // Mock validation to pass
    (validateLogin as jest.Mock).mockReturnValue({ error: false, data: login });
    // Mock service to return error
    (loginUserService as jest.Mock).mockResolvedValue({ error: true, message: 'User does not exist' });

    // Simulate a request with login credentials in the request body
    req.body = login;

    await loginUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith('User does not exist');
  });

  it('should respond with a message for defaultUser', async () => {
    await defaultUser(req as Request, res as Response);

    expect(res.json).toHaveBeenCalledWith({ msg: 'API Users Working' });
  });
});
