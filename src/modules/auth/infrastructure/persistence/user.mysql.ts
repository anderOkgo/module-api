import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Database, HDB } from '../../../../infrastructure/my.database.helper';
import Login from '../../domain/entities/login.entity';
import User from '../../domain/entities/user.entity';
import { UserRepository } from '../../application/ports/user.repository';
import sendEmail from '../../../../infrastructure/services/email';
import { validateEmail, validateUsername, validateVerificationCode, userInfo } from './user.mysql.validations';

export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  async create(user: any): Promise<User> {
    // Implementación temporal - mantener la lógica existente
    const result = await this.addUser(user);
    if (result && result.error) {
      const message = Array.isArray(result.message) ? result.message.join(', ') : result.message;
      throw new Error(message);
    }
    // Retornar un usuario mock por ahora
    return {
      id: 1,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      role: 2,
      password: user.password,
      active: true,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
    } as User;
  }

  async findById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = ?';
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    return await userInfo(email || username, this.Database);
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

  async update(user: Partial<User>): Promise<User> {
    // Implementación temporal
    throw new Error('Method not implemented');
  }

  async updatePassword(userId: number, hashedPassword: string): Promise<void> {
    const query = 'UPDATE users SET password = ? WHERE id = ?';
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

  async delete(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = ?';
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  public addUser = async (user: User) => {
    const { username, password, email, verificationCode } = user;
    const errors: string[] = [];

    const emailError = await validateEmail(email, this.Database, HDB);
    if (emailError) errors.push(emailError);

    const usernameError = await validateUsername(username, this.Database, HDB);
    if (usernameError) errors.push(usernameError);

    const verificationCodeError = await validateVerificationCode(email, verificationCode || 0, this.Database);
    if (verificationCodeError) errors.push(verificationCodeError);

    if (errors.length > 0) return { error: true, message: errors };

    const sqlInsEmailVerification = `INSERT INTO email_verification (email, verification_code) VALUES (?, ?)`;
    const sqlDelEmailVerification = `DELETE FROM email_verification WHERE email = ?`;
    const sqlInsUser = `INSERT INTO users SET ?`;

    if (!verificationCode) {
      const generatedVerificationCode = Math.floor(100000 + Math.random() * 900000);
      const verifyArray = [email, generatedVerificationCode];
      const isInsert = await this.Database.executeSafeQuery(sqlInsEmailVerification, verifyArray);
      sendEmail(email, 'Verification Code', `Your verification code is: ${generatedVerificationCode}`);
      console.log(generatedVerificationCode);

      return { error: false, message: 'Verification code sent' };
    } else {
      const newUser = {
        first_name: '',
        last_name: '',
        username: username,
        email: email,
        role: 2,
        password: await bcrypt.hash(password, 10),
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      const isDelete = await this.Database.executeSafeQuery(sqlDelEmailVerification, [email]);
      const insertUserResult = await this.Database.executeSafeQuery(sqlInsUser, newUser);
      if (insertUserResult.insertId) return { error: false, message: 'User created successfully' };
    }
  };

  public loginUser = async (login: Login) => {
    const { username, email, password } = login;
    // Usar email si está disponible, sino usar username
    const loginIdentifier = email || username;

    if (!loginIdentifier) {
      return { error: true, message: 'Username or email is required' };
    }

    const user = await userInfo(loginIdentifier, this.Database);

    if (user) {
      try {
        const result = await bcrypt.compare(password, user.password);
        return result
          ? {
              error: false,
              token: jwt.sign({ username: user.username, role: user.role }, process.env.SECRET_KEY || 'enterkey'),
            }
          : { error: true, message: 'Wrong Password' };
      } catch (error) {
        console.error('Error comparing passwords:', error);
        return { errorSys: true, message: 'Internal Server Error' };
      }
    } else {
      return { error: true, message: 'User does not exist' };
    }
  };
}
