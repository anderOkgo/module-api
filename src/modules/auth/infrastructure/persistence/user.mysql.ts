import { Database } from '../../../../infrastructure/my.database.helper';
import User from '../../domain/entities/user.entity';
import { UserRepository } from '../../application/ports/user.repository';

/**
 * MySQL implementation of the user repository
 * ONLY contains data access logic, no business logic
 */
export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  // ==================== BASIC CRUD ====================

  async create(user: User): Promise<User> {
    const query = 'INSERT INTO users SET ?';
    const result = await this.Database.executeSafeQuery(query, user);

    if (result.errorSys) {
      throw new Error('Error creating user');
    }

    const createdUser = await this.findById(result.insertId);
    if (!createdUser) {
      throw new Error('User created but not found');
    }

    return createdUser;
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = ?';
    const result = await this.Database.executeSafeQuery(query, [email]);
    return result.length > 0 ? result[0] : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE username = ?';
    const result = await this.Database.executeSafeQuery(query, [username]);
    return result.length > 0 ? result[0] : null;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    // First try to search by username
    if (username) {
      const byUsername = await this.findByUsername(username);
      if (byUsername) return byUsername;
    }

    // If not found by username, search by email
    if (email) {
      return await this.findByEmail(email);
    }

    return null;
  }

  async update(user: Partial<User>): Promise<User> {
    if (!user.id) {
      throw new Error('User ID is required for update');
    }

    const query = 'UPDATE users SET ? WHERE id = ?';
    await this.Database.executeSafeQuery(query, [user, user.id]);

    const updatedUser = await this.findById(user.id);
    if (!updatedUser) {
      throw new Error('User not found after update');
    }

    return updatedUser;
  }

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // ==================== AUTHENTICATION METHODS ====================

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    const query = 'UPDATE users SET password = ?, modified = NOW() WHERE id = ?';
    await this.Database.executeSafeQuery(query, [hashedPassword, userId]);
  }

  async updateLastLogin(userId: number): Promise<void> {
    const query = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    await this.Database.executeSafeQuery(query, [userId]);
  }

  async incrementLoginAttempts(userId: number): Promise<void> {
    const query = 'UPDATE users SET login_attempts = COALESCE(login_attempts, 0) + 1 WHERE id = ?';
    await this.Database.executeSafeQuery(query, [userId]);
  }

  async resetLoginAttempts(userId: number): Promise<void> {
    const query = 'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?';
    await this.Database.executeSafeQuery(query, [userId]);
  }

  async lockUser(userId: number, lockUntil: Date): Promise<void> {
    const query = 'UPDATE users SET locked_until = ? WHERE id = ?';
    await this.Database.executeSafeQuery(query, [lockUntil, userId]);
  }

  async unlockUser(userId: number): Promise<void> {
    const query = 'UPDATE users SET locked_until = NULL WHERE id = ?';
    await this.Database.executeSafeQuery(query, [userId]);
  }

  // ==================== VERIFICATION CODES ====================

  async saveVerificationCode(email: string, code: number): Promise<void> {
    const query = 'INSERT INTO email_verification (email, verification_code) VALUES (?, ?)';
    await this.Database.executeSafeQuery(query, [email, code]);
  }

  async validateVerificationCode(email: string, code: number): Promise<boolean> {
    const query = 'SELECT * FROM email_verification WHERE email = ? AND verification_code = ?';
    const result = await this.Database.executeSafeQuery(query, [email, code]);
    return result.length > 0;
  }

  async deleteVerificationCode(email: string): Promise<void> {
    const query = 'DELETE FROM email_verification WHERE email = ?';
    await this.Database.executeSafeQuery(query, [email]);
  }
}
