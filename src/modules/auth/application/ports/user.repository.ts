import User, { UserCreateRequest } from '../../domain/entities/user.entity';

export interface UserRepository {
  // Métodos principales (existentes en el repositorio original)
  addUser(user: any): Promise<any>;
  loginUser(login: any): Promise<any>;

  // Métodos adicionales para funcionalidad extendida
  create(user: UserCreateRequest): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  update(user: Partial<User>): Promise<User>;
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockUser(userId: number, lockUntil: Date): Promise<void>;
  unlockUser(userId: number): Promise<void>;
  delete(id: number): Promise<boolean>;
}
