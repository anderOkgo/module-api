import { Request, Response } from 'express';
import {
  UserController,
  IP_LIMIT_MESSAGE,
} from '../../../../src/modules/auth/infrastructure/controllers/user.controller';
import { IpAttemptLimiter } from '../../../../src/modules/auth/application/use-cases/ip-attempt.limiter';
import { RegisterUserUseCase } from '../../../../src/modules/auth/application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../../../src/modules/auth/application/use-cases/login.use-case';

// Mock the use cases
const mockRegisterUserUseCase = {
  execute: jest.fn(),
} as any;

const mockLoginUserUseCase = {
  execute: jest.fn(),
} as any;

const mockAdminResetPasswordUseCase = {
  execute: jest.fn(),
} as any;

const mockRequestPasswordResetUseCase = {
  execute: jest.fn(),
} as any;

const mockConfirmPasswordResetUseCase = {
  execute: jest.fn(),
} as any;

describe('UserController', () => {
  let userController: UserController;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    userController = new UserController(
      mockRegisterUserUseCase,
      mockLoginUserUseCase,
      mockAdminResetPasswordUseCase,
      mockRequestPasswordResetUseCase,
      mockConfirmPasswordResetUseCase
    );
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

  it('should reset a password successfully', async () => {
    const requestBody = { identifier: 'testuser', newPassword: 'newSecurePassword123' };
    const expectedResponse = { error: false, message: 'Password reset successfully' };

    mockAdminResetPasswordUseCase.execute.mockResolvedValue(expectedResponse);
    req.body = requestBody;

    await userController.adminResetPassword(req as Request, res as Response);

    expect(mockAdminResetPasswordUseCase.execute).toHaveBeenCalledWith('testuser', 'newSecurePassword123');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expectedResponse);
  });

  it('should return error when password reset fails', async () => {
    const requestBody = { identifier: 'nosuchuser', newPassword: 'newSecurePassword123' };
    const errorResponse = { error: true, message: 'User not found' };

    mockAdminResetPasswordUseCase.execute.mockResolvedValue(errorResponse);
    req.body = requestBody;

    await userController.adminResetPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(errorResponse);
  });

  it('should handle internal server error during password reset', async () => {
    req.body = { identifier: 'testuser', newPassword: 'newSecurePassword123' };
    mockAdminResetPasswordUseCase.execute.mockRejectedValue(new Error('Database error'));

    await userController.adminResetPassword(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: true,
      message: 'Internal server error',
    });
  });

  // Auth SPEC v0.5
  it('answers 429, without the status field in the body, when a register code was sent less than a minute ago', async () => {
    mockRegisterUserUseCase.execute.mockResolvedValue({
      error: true,
      message: 'Too many requests, try again in a minute',
      status: 429,
    });

    await userController.addUser(req as Request, res as Response);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: true, message: 'Too many requests, try again in a minute' });
  });

  it('passes the email to C4 and answers 200 or 400', async () => {
    req.body = { email: 'sample@example.com' };
    mockRequestPasswordResetUseCase.execute.mockResolvedValueOnce({ error: false, message: 'sent' });
    await userController.requestPasswordReset(req as Request, res as Response);
    expect(mockRequestPasswordResetUseCase.execute).toHaveBeenCalledWith('sample@example.com');
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockRequestPasswordResetUseCase.execute.mockResolvedValueOnce({ error: true, message: 'Invalid email format' });
    await userController.requestPasswordReset(req as Request, res as Response);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  it('C4 copes with no body, and answers 500 when the use case throws', async () => {
    req.body = undefined;
    mockRequestPasswordResetUseCase.execute.mockResolvedValueOnce({ error: true, message: 'Invalid email format' });
    await userController.requestPasswordReset(req as Request, res as Response);
    expect(mockRequestPasswordResetUseCase.execute).toHaveBeenCalledWith(undefined);

    const error = jest.spyOn(console, 'error').mockImplementation();
    mockRequestPasswordResetUseCase.execute.mockRejectedValueOnce(new Error('boom'));
    await userController.requestPasswordReset(req as Request, res as Response);
    expect(res.status).toHaveBeenLastCalledWith(500);
    expect(res.json).toHaveBeenLastCalledWith({ error: true, message: 'Internal server error' });
    error.mockRestore();
  });

  it('passes email, code and new password to C5 and answers 200 or 400', async () => {
    req.body = { email: 'sample@example.com', code: 123456, newPassword: 'newSecret' };
    mockConfirmPasswordResetUseCase.execute.mockResolvedValueOnce({ error: false, message: 'Password changed' });
    await userController.confirmPasswordReset(req as Request, res as Response);
    expect(mockConfirmPasswordResetUseCase.execute).toHaveBeenCalledWith('sample@example.com', 123456, 'newSecret');
    expect(res.status).toHaveBeenLastCalledWith(200);

    mockConfirmPasswordResetUseCase.execute.mockResolvedValueOnce({ error: true, message: 'Invalid or expired code' });
    await userController.confirmPasswordReset(req as Request, res as Response);
    expect(res.status).toHaveBeenLastCalledWith(400);
  });

  it('C5 copes with no body, and answers 500 when the use case throws', async () => {
    req.body = undefined;
    mockConfirmPasswordResetUseCase.execute.mockResolvedValueOnce({ error: true, message: 'x' });
    await userController.confirmPasswordReset(req as Request, res as Response);
    expect(mockConfirmPasswordResetUseCase.execute).toHaveBeenCalledWith(undefined, undefined, undefined);

    const error = jest.spyOn(console, 'error').mockImplementation();
    mockConfirmPasswordResetUseCase.execute.mockRejectedValueOnce(new Error('boom'));
    await userController.confirmPasswordReset(req as Request, res as Response);
    expect(res.status).toHaveBeenLastCalledWith(500);
    error.mockRestore();
  });

  describe('limit per IP (Auth SPEC v0.6)', () => {
    const ip = '203.0.113.7';
    let limiter: IpAttemptLimiter;

    beforeEach(() => {
      limiter = new IpAttemptLimiter();
      jest.spyOn(console, 'warn').mockImplementation(() => undefined);
      userController = new UserController(
        mockRegisterUserUseCase,
        mockLoginUserUseCase,
        mockAdminResetPasswordUseCase,
        mockRequestPasswordResetUseCase,
        mockConfirmPasswordResetUseCase,
        limiter
      );
      req = { body: {}, ip } as Partial<Request>;
    });

    afterEach(() => jest.restoreAllMocks());

    const block = () => {
      for (let i = 0; i < 20; i++) limiter.recordFailure(ip);
    };

    it('counts a failed secret and never sends the internal flag to the client', async () => {
      mockLoginUserUseCase.execute.mockResolvedValueOnce({
        error: true,
        message: 'Invalid credentials',
        failedSecret: true,
      });
      for (let i = 0; i < 19; i++) limiter.recordFailure(ip);
      await userController.loginUser(req as Request, res as Response);
      expect(res.json).toHaveBeenLastCalledWith({ error: true, message: 'Invalid credentials' });
      expect(limiter.isBlocked(ip)).toBe(true);
    });

    it('does not count an error that checked no secret', async () => {
      mockLoginUserUseCase.execute.mockResolvedValueOnce({ error: true, message: 'Account is inactive' });
      for (let i = 0; i < 19; i++) limiter.recordFailure(ip);
      await userController.loginUser(req as Request, res as Response);
      expect(limiter.isBlocked(ip)).toBe(false);
    });

    it('refuses login with 429 before checking the password, even a right one (F1)', async () => {
      block();
      await userController.loginUser(req as Request, res as Response);
      expect(mockLoginUserUseCase.execute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenLastCalledWith(429);
      expect(res.json).toHaveBeenLastCalledWith({ error: true, message: IP_LIMIT_MESSAGE });
    });

    it('refuses registration with a code, but not the request for a code', async () => {
      block();
      req.body = { email: 'sample@example.com', verificationCode: 123456 };
      await userController.addUser(req as Request, res as Response);
      expect(mockRegisterUserUseCase.execute).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenLastCalledWith(429);

      req.body = { email: 'sample@example.com' };
      mockRegisterUserUseCase.execute.mockResolvedValueOnce({ error: false, message: 'Verification code sent' });
      await userController.addUser(req as Request, res as Response);
      expect(res.status).toHaveBeenLastCalledWith(201);
    });

    it('counts a wrong registration code (F4)', async () => {
      for (let i = 0; i < 19; i++) limiter.recordFailure(ip);
      req.body = { email: 'sample@example.com', verificationCode: 111111 };
      mockRegisterUserUseCase.execute.mockResolvedValueOnce({
        error: true,
        message: 'Invalid verification code',
        failedSecret: true,
      });
      await userController.addUser(req as Request, res as Response);
      expect(res.json).toHaveBeenLastCalledWith({ error: true, message: 'Invalid verification code' });
      expect(limiter.isBlocked(ip)).toBe(true);
    });

    it('refuses C5 with 429 and counts its wrong codes (F4)', async () => {
      for (let i = 0; i < 19; i++) limiter.recordFailure(ip);
      req.body = { email: 'sample@example.com', code: 111111, newPassword: 'newSecret' };
      mockConfirmPasswordResetUseCase.execute.mockResolvedValueOnce({
        error: true,
        message: 'Invalid or expired code',
        failedSecret: true,
      });
      await userController.confirmPasswordReset(req as Request, res as Response);
      expect(res.json).toHaveBeenLastCalledWith({ error: true, message: 'Invalid or expired code' });

      await userController.confirmPasswordReset(req as Request, res as Response);
      expect(mockConfirmPasswordResetUseCase.execute).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenLastCalledWith(429);
    });

    it('leaves C4 and the admin reset unlimited (S.3)', async () => {
      block();
      mockRequestPasswordResetUseCase.execute.mockResolvedValueOnce({ error: false, message: 'ok' });
      await userController.requestPasswordReset(req as Request, res as Response);
      expect(res.status).toHaveBeenLastCalledWith(200);

      req.body = { identifier: 'someone', newPassword: 'newSecret' };
      mockAdminResetPasswordUseCase.execute.mockResolvedValueOnce({ error: false, message: 'ok' });
      await userController.adminResetPassword(req as Request, res as Response);
      expect(res.status).toHaveBeenLastCalledWith(200);
    });
  });
});
