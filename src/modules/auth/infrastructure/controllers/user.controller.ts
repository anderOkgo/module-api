import { Request, Response } from 'express';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';

/**
 * UserController con inyección de dependencias
 * Sigue el patrón hexagonal/clean architecture
 */
export class UserController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase
  ) {}

  /**
   * Registrar nuevo usuario
   * Documentación Swagger: user.swagger.ts
   */
  addUser = async (req: Request, res: Response) => {
    try {
      const result = await this.registerUserUseCase.execute(req.body);

      if (result.error) {
        return res.status(400).json(result);
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
   * Iniciar sesión de usuario
   * Documentación Swagger: user.swagger.ts
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
}
