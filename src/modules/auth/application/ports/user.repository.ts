import User from '../../domain/entities/user.entity';

/**
 * Puerto de repositorio para entidad User
 * Define el contrato para acceso a datos de usuarios
 */
export interface UserRepository {
  // CRUD básico
  create(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;
  update(user: Partial<User>): Promise<User>;
  delete(id: number): Promise<boolean>;

  // Métodos específicos de autenticación
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockUser(userId: number, lockUntil: Date): Promise<void>;
  unlockUser(userId: number): Promise<void>;

  // Métodos para códigos de verificación
  saveVerificationCode(email: string, code: number): Promise<void>;
  validateVerificationCode(email: string, code: number): Promise<boolean>;
  deleteVerificationCode(email: string): Promise<void>;
}
