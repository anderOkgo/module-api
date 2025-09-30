import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';
import { userMysqlRepository } from '../persistence/user.mysql';

/**
 * Composition Root para el módulo Auth
 * Construye y cablea las dependencias usando Clean Architecture
 * Sigue el patrón hexagonal con inyección de dependencias
 */
export function buildAuthModule() {
  // 1. Crear repositorio (Infrastructure Layer)
  const userRepository = new userMysqlRepository();

  // 2. Crear Use Cases (Application Layer) - inyectando dependencias
  const registerUserUseCase = new RegisterUserUseCase(userRepository);
  const loginUserUseCase = new LoginUserUseCase(userRepository);

  // 3. Crear Controlador (Infrastructure Layer) - inyectando Use Cases
  const userController = new UserController(registerUserUseCase, loginUserUseCase);

  // 4. Configurar rutas
  const router = Router();
  router.post('/add', userController.addUser);
  router.post('/login', userController.loginUser);

  return {
    router,
    userController,
    userRepository,
    registerUserUseCase,
    loginUserUseCase,
  };
}
