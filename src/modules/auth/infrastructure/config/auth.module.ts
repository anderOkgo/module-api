import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';
import { userMysqlRepository } from '../persistence/user.mysql';
import { BcryptPasswordHasherService } from '../services/bcrypt-password-hasher.service';
import { JwtTokenGeneratorService } from '../services/jwt-token-generator.service';
import { SmtpEmailService } from '../services/smtp-email.service';

/**
 * Composition Root for the Auth module
 * Builds and wires ALL dependencies using Clean Architecture
 * Follows hexagonal pattern with manual dependency injection
 *
 * ✅ FOLLOWS Clean Architecture:
 * - Application does NOT import Infrastructure
 * - All dependencies are injected here
 * - Use Cases contain business logic
 * - Repository ONLY data access
 */
export function buildAuthModule() {
  // 1. Create infrastructure adapters (concrete implementations)
  const passwordHasher = new BcryptPasswordHasherService();
  const tokenGenerator = new JwtTokenGeneratorService();
  const emailService = new SmtpEmailService();

  // 2. Create repository (Infrastructure Layer)
  const userRepository = new userMysqlRepository();

  // 3. Create Use Cases (Application Layer) - injecting ALL dependencies
  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, emailService);

  const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenGenerator);

  // 4. Create Controller (Infrastructure Layer) - injecting Use Cases
  const userController = new UserController(registerUserUseCase, loginUserUseCase);

  // 5. Configure routes
  const router = Router();
  router.post('/add', userController.addUser);
  router.post('/login', userController.loginUser);

  return {
    router,
    // Expose instances for testing
    userController,
    userRepository,
    registerUserUseCase,
    loginUserUseCase,
    passwordHasher,
    tokenGenerator,
    emailService,
  };
}
