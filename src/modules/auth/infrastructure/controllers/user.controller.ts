import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';
import { AdminResetPasswordUseCase } from '../../application/use-cases/admin-reset-password.use-case';
import {
  RequestPasswordResetUseCase,
  ConfirmPasswordResetUseCase,
} from '../../application/use-cases/password-reset.use-case';
import { IpAttemptLimiter } from '../../application/use-cases/ip-attempt.limiter';

/** The answer of C1, C2 and C5 while an IP is over its limit (Auth SPEC v0.6, S.3). */
export const IP_LIMIT_MESSAGE = 'Too many attempts, try again later';

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
    private readonly confirmPasswordResetUseCase: ConfirmPasswordResetUseCase,
    private readonly ipLimiter: IpAttemptLimiter = new IpAttemptLimiter()
  ) {}

  /**
   * The limit is checked before the password or the code, so a blocked IP learns nothing (S.3).
   * Returns true when the request was answered with a 429.
   */
  private refuseIfBlocked(req: Request, res: Response): boolean {
    if (!this.ipLimiter.isBlocked(req.ip)) return false;
    res.status(429).json({ error: true, message: IP_LIMIT_MESSAGE });
    return true;
  }

  /** Counts a wrong secret for this IP and returns the result without the internal flag. */
  private countFailure<T extends { failedSecret?: boolean }>(req: Request, result: T): Omit<T, 'failedSecret'> {
    const { failedSecret, ...answer } = result;
    if (failedSecret) this.ipLimiter.recordFailure(req.ip);
    return answer;
  }

  /**
   * Register new user
   * Swagger documentation: user.swagger.ts
   */
  addUser = async (req: Request, res: Response) => {
    try {
      // Only the step that checks a code is limited; asking for a code has its own limit per email
      if (req.body?.verificationCode && this.refuseIfBlocked(req, res)) return;

      const { status, ...result } = this.countFailure(req, await this.registerUserUseCase.execute(req.body));

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
      if (this.refuseIfBlocked(req, res)) return;

      const result = this.countFailure(req, await this.loginUserUseCase.execute(req.body));

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
      if (this.refuseIfBlocked(req, res)) return;

      const { email, code, newPassword } = req.body ?? {};
      const result = this.countFailure(
        req,
        await this.confirmPasswordResetUseCase.execute(email, code, newPassword)
      );
      return res.status(result.error ? 400 : 200).json(result);
    } catch (error) {
      console.error('Error in confirmPasswordReset:', error);
      return res.status(500).json({ error: true, message: 'Internal server error' });
    }
  };
}
