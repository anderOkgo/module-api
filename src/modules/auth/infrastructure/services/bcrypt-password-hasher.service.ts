import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';
const bcrypt = require('bcryptjs');

/**
 * Adaptador de infraestructura para hash de contraseñas usando bcrypt
 * Implementa el puerto PasswordHasherPort
 */
export class BcryptPasswordHasherService implements PasswordHasherPort {
  private readonly SALT_ROUNDS = 10;

  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, this.SALT_ROUNDS);
  }

  async compare(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  }
}
