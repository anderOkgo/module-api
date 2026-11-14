import User from '../../domain/entities/user.entity';

/** What an emailed code is for (Auth SPEC v0.5, D3). */
export type CodePurpose = 'register' | 'reset';

/** The pending code of an email and purpose, with its age as the database clock sees it. */
export interface StoredCode {
  id: number;
  code: number;
  attempts: number;
  ageSeconds: number;
}

/**
 * Repository port for User entity
 * Defines the contract for user data access
 */
export interface UserRepository {
  // Basic CRUD
  create(user: User): Promise<User>;
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;
  update(user: Partial<User>): Promise<User>;
  delete(id: number): Promise<boolean>;

  // Authentication-specific methods
  updatePassword(userId: number, hashedPassword: string): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;
  incrementLoginAttempts(userId: number): Promise<void>;
  resetLoginAttempts(userId: number): Promise<void>;
  lockUser(userId: number, lockUntil: Date): Promise<void>;
  unlockUser(userId: number): Promise<void>;

  // Emailed codes (registration and password reset), one pending code per email and purpose
  /** Replaces any earlier code of this email and purpose with a new one. */
  saveVerificationCode(email: string, code: number, purpose?: CodePurpose): Promise<void>;
  /** The newest code of this email and purpose, or null. */
  findVerificationCode(email: string, purpose?: CodePurpose): Promise<StoredCode | null>;
  /** Counts one wrong try on a code. */
  incrementVerificationAttempts(id: number): Promise<void>;
  deleteVerificationCode(email: string, purpose?: CodePurpose): Promise<void>;
}
