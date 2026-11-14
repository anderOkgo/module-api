import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { RegisterUserUseCase } from '../../application/use-cases/register.use-case';
import { LoginUserUseCase } from '../../application/use-cases/login.use-case';
import { AdminResetPasswordUseCase } from '../../application/use-cases/admin-reset-password.use-case';
import {
  RequestPasswordResetUseCase,
  ConfirmPasswordResetUseCase,
} from '../../application/use-cases/password-reset.use-case';
import { VerificationCodePolicy } from '../../application/use-cases/verification-code.policy';
import { userMysqlRepository } from '../persistence/user.mysql';
import { BcryptPasswordHasherService } from '../services/bcrypt-password-hasher.service';
import { JwtTokenGeneratorService } from '../services/jwt-token-generator.service';
import { SmtpEmailService } from '../services/smtp-email.service';
import validateAdmin from '../../../../infrastructure/services/validate-admin';

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
  // Emailed codes follow one policy for registration and password reset (Auth SPEC v0.5, D3)
  const codes = new VerificationCodePolicy(userRepository);

  const registerUserUseCase = new RegisterUserUseCase(userRepository, passwordHasher, emailService, codes);

  const loginUserUseCase = new LoginUserUseCase(userRepository, passwordHasher, tokenGenerator);

  const adminResetPasswordUseCase = new AdminResetPasswordUseCase(userRepository, passwordHasher);

  const requestPasswordResetUseCase = new RequestPasswordResetUseCase(userRepository, emailService, codes);

  const confirmPasswordResetUseCase = new ConfirmPasswordResetUseCase(userRepository, passwordHasher, codes);

  // 4. Create Controller (Infrastructure Layer) - injecting Use Cases
  const userController = new UserController(
    registerUserUseCase,
    loginUserUseCase,
    adminResetPasswordUseCase,
    requestPasswordResetUseCase,
    confirmPasswordResetUseCase
  );

  // 5. Configure routes
  const router = Router();
  router.post('/add', userController.addUser);
  router.post('/login', userController.loginUser);
  router.put('/admin/reset-password', validateAdmin, userController.adminResetPassword);
  router.post('/password-reset/request', userController.requestPasswordReset);
  router.post('/password-reset/confirm', userController.confirmPasswordReset);

  return {
    router,
    // Expose instances for testing
    userController,
    userRepository,
    registerUserUseCase,
    loginUserUseCase,
    adminResetPasswordUseCase,
    passwordHasher,
    tokenGenerator,
    emailService,
  };
}
