import { Request, Response } from 'express';
import { UserController } from '../../../../src/modules/auth/infrastructure/controllers/user.controller';
import { RegisterUserUseCase } from '../../../../src/modules/auth/application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../../../src/modules/auth/application/use-cases/login.use-case';

// Mock the use cases
const mockRegisterUserUseCase = {
  execute: jest.fn(),
} as any;

const mockLoginUserUseCase = {
  execute: jest.fn(),
} as any;

describe('UserController', () => {
  let userController: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    userController = new UserController(mockRegisterUserUseCase, mockLoginUserUseCase);
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res as Response),
    };
    jest.clearAllMocks();
  });

  it('should register a user successfully', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
      first_name: 'Test',
      last_name: 'User',
    };

    const expectedResponse = {
      error: false,
      message: 'User created successfully',
      data: {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: 1,
        active: true,
        created: '2023-01-01 00:00:00',
      },
    };

    mockRegisterUserUseCase.execute.mockResolvedValue(expectedResponse);
    req.body = userData;

    await userController.addUser(req as Request, res as Response);

    expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(userData);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return error when registration fails', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
      first_name: 'Test',
      last_name: 'User',
    };

    const errorResponse = {
      error: true,
      message: 'Email already exists',
    };

    mockRegisterUserUseCase.execute.mockResolvedValue(errorResponse);
    req.body = userData;

    await userController.addUser(req as Request, res as Response);

    expect(mockRegisterUserUseCase.execute).toHaveBeenCalledWith(userData);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errorResponse);
  });

  it('should login user successfully', async () => {
    const loginData = {
      username: 'testuser',
      password: 'testpassword',
    };

    const expectedResponse = {
      error: false,
      token: 'test-token',
      data: {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 1,
          active: true,
          created: '2023-01-01 00:00:00',
        },
        token: 'test-token',
        expiresIn: 86400,
      },
    };

    mockLoginUserUseCase.execute.mockResolvedValue(expectedResponse);
    req.body = loginData;

    await userController.loginUser(req as Request, res as Response);

    expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(loginData);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return error when login fails', async () => {
    const loginData = {
      username: 'testuser',
      password: 'wrongpassword',
    };

    const errorResponse = {
      error: true,
      message: 'Invalid credentials',
    };

    mockLoginUserUseCase.execute.mockResolvedValue(errorResponse);
    req.body = loginData;

    await userController.loginUser(req as Request, res as Response);

    expect(mockLoginUserUseCase.execute).toHaveBeenCalledWith(loginData);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errorResponse);
  });

  it('should handle internal server error during registration', async () => {
    const userData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword',
      first_name: 'Test',
      last_name: 'User',
    };

    mockRegisterUserUseCase.execute.mockRejectedValue(new Error('Database error'));
    req.body = userData;

    await userController.addUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Internal server error',
    });
  });

  it('should handle internal server error during login', async () => {
    const loginData = {
      username: 'testuser',
      password: 'testpassword',
    };

    mockLoginUserUseCase.execute.mockRejectedValue(new Error('Database error'));
    req.body = loginData;

    await userController.loginUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Internal server error',
    });
  });
});
