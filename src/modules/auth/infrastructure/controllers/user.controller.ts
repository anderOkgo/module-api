import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';
import { AdminResetPasswordUseCase } from '../../application/use-cases/admin-reset-password.use-case';
import {
  RequestPasswordResetUseCase,
  ConfirmPasswordResetUseCase,
} from '../../application/use-cases/password-reset.use-case';

/**
 * UserController with dependency injection
 * Follows hexagonal/clean architecture pattern
 */
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    private readonly adminResetPasswordUseCase: AdminResetPasswordUseCase,
    private readonly requestPasswordResetUseCase: RequestPasswordResetUseCase,
    private readonly confirmPasswordResetUseCase: ConfirmPasswordResetUseCase
  ) {}

  /**
   * Register new user
   * Swagger documentation: user.swagger.ts
   */
  addUser = async (req: Request, res: Response) => {
    try {
      const { status, ...result } = await this.registerUserUseCase.execute(req.body);

      if (result.error) {
        // 429 when a code was already sent less than a minute ago (Auth SPEC v0.5)
        return res.status(status ?? 400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('Error in addUser:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }
  };

  /**
   * User login
   * Swagger documentation: user.swagger.ts
   */
  loginUser = async (req: Request, res: Response) => {
    try {
      const result = await this.loginUserUseCase.execute(req.body);

      if (result.error) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in loginUser:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }
  };

  /**
   * Admin resets another user's password (username or email + new password)
   * Swagger documentation: user.swagger.ts
   */
  adminResetPassword = async (req: Request, res: Response) => {
    try {
      const { identifier, newPassword } = req.body;
      const result = await this.adminResetPasswordUseCase.execute(identifier, newPassword);

      if (result.error) {
        return res.status(400).json(result);
      }

      res.status(200).json(result);
    } catch (error) {
      console.error('Error in adminResetPassword:', error);
      return res.status(500).json({
        error: true,
        message: 'Internal server error',
      });
    }
  };

  /**
   * C4: ask for a password reset code (Auth SPEC v0.5)
   * Swagger documentation: user.swagger.ts
   */
  requestPasswordReset = async (req: Request, res: Response) => {
    try {
      const result = await this.requestPasswordResetUseCase.execute(req.body?.email);
      return res.status(result.error ? 400 : 200).json(result);
    } catch (error) {
      console.error('Error in requestPasswordReset:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };

  /**
   * C5: set a new password with the emailed code (Auth SPEC v0.5)
   * Swagger documentation: user.swagger.ts
   */
  confirmPasswordReset = async (req: Request, res: Response) => {
    try {
      const { email, code, newPassword } = req.body ?? {};
      const result = await this.confirmPasswordResetUseCase.execute(email, code, newPassword);
      return res.status(result.error ? 400 : 200).json(result);
    } catch (error) {
      console.error('Error in confirmPasswordReset:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };
}
