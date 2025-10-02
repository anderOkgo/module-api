import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';
import { userMysqlRepository } from '../persistence/user.mysql';
import { BcryptPasswordHasherService } from '../services/bcrypt-password-hasher.service';
import { JwtTokenGeneratorService } from '../services/jwt-token-generator.service';
import { SmtpEmailService } from '../services/smtp-email.service';

/**
 * Composition Root para el módulo Auth
 * Construye y cablea TODAS las dependencias usando Clean Architecture
 * Sigue el patrón hexagonal con inyección de dependencias manual
 *
 * ✅ CUMPLE Clean Architecture:
 * - Application NO importa Infrastructure
 * - Todas las dependencias se inyectan aquí
 * - Use Cases contienen lógica de negocio
 * - Repository SOLO acceso a datos
 */
export function buildAuthModule() {
  // 1. Crear adaptadores de infraestructura (implementaciones concretas)
  const passwordHasher = new BcryptPasswordHasherService();
  const tokenGenerator = new JwtTokenGeneratorService();
  const emailService = new SmtpEmailService();

  // 2. Crear repositorio (Infrastructure Layer)
  const userRepository = new userMysqlRepository();

  // 3. Crear Use Cases (Application Layer) - inyectando TODAS las dependencias
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, emailService);

  const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenGenerator);

  // 4. Crear Controlador (Infrastructure Layer) - inyectando Use Cases
  const userController = new UserController(registerUserUseCase, loginUserUseCase);

  // 5. Configurar rutas
  const router = Router();
  router.post('/add', userController.addUser);
  router.post('/login', userController.loginUser);

  return {
    router,
    // Exponer instancias para testing
    userController,
    userRepository,
    registerUserUseCase,
    loginUserUseCase,
    passwordHasher,
    tokenGenerator,
    emailService,
  };
}
