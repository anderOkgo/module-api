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
   * @swagger
   * /api/users/add:
   *   post:
   *     summary: Registrar nuevo usuario
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - first_name
   *               - last_name
   *               - username
   *               - email
   *               - password
   *             properties:
   *               first_name:
   *                 type: string
   *                 description: Nombre del usuario
   *                 example: "Juan"
   *               last_name:
   *                 type: string
   *                 description: Apellido del usuario
   *                 example: "Pérez"
   *               username:
   *                 type: string
   *                 description: Nombre de usuario único
   *                 example: "juanperez"
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Correo electrónico del usuario
   *                 example: "juan@example.com"
   *               password:
   *                 type: string
   *                 minLength: 6
   *                 description: Contraseña del usuario
   *                 example: "password123"
   *     responses:
   *       201:
   *         description: Usuario registrado exitosamente
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Usuario registrado exitosamente"
   *                 data:
   *                   type: object
   *                   properties:
   *                     id:
   *                       type: number
   *                       example: 1
   *                     username:
   *                       type: string
   *                       example: "juanperez"
   *                     email:
   *                       type: string
   *                       example: "juan@example.com"
   *       400:
   *         description: Error en la validación o usuario ya existe
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
   * @swagger
   * /api/users/login:
   *   post:
   *     summary: Iniciar sesión de usuario
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - username
   *               - password
   *             properties:
   *               username:
   *                 type: string
   *                 description: Nombre de usuario o email
   *                 example: "juanperez"
   *               password:
   *                 type: string
   *                 description: Contraseña del usuario
   *                 example: "password123"
   *     responses:
   *       200:
   *         description: Login exitoso
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 error:
   *                   type: boolean
   *                   example: false
   *                 message:
   *                   type: string
   *                   example: "Login exitoso"
   *                 data:
   *                   type: object
   *                   properties:
   *                     token:
   *                       type: string
   *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     user:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: number
   *                           example: 1
   *                         username:
   *                           type: string
   *                           example: "juanperez"
   *                         email:
   *                           type: string
   *                           example: "juan@example.com"
   *       400:
   *         description: Credenciales inválidas
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
   *       500:
   *         description: Error interno del servidor
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Error'
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
