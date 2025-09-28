import User, { UserCreateRequest } from '../../domain/models/User';
import Login from '../../domain/models/Login';

export interface UserRepository {
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
