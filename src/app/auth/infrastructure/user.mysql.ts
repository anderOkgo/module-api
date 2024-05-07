import { crypt } from '../../../helpers/crypt.helper';
import { Database } from '../../../helpers/my.database.helper';
import { token as _token } from '../../../helpers/token.helper';
import Login from '../domain/models/Login';
import User from '../domain/models/User';
import { UserRepository } from './repositories/user.repository';
import sendEmail from '../../../helpers/lib/email';

export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  public addUserRepository = async (user: User) => {
    if (Object.keys(user).length === 0) {
      return { error: true, errors: ['User object is empty'] };
    }

    const { first_name, password, email, verificationCode } = user;
    const errors: string[] = [];
    const existingEmail = await this.Database.executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existingEmail.error) return { error: true, message: 'Internal server error' };
    if (existingEmail.result.length > 0) errors.push('Email already exists');

    const existingUser = await this.Database.executeQuery('SELECT * FROM users WHERE first_name = ?', [
      first_name,
    ]);
    if (existingUser.error) return { error: true, message: 'Internal server error' };
    if (existingUser.result.length > 0) errors.push('User already exists');

    if (verificationCode) {
      const verificationCodeExists = await this.verifyVerificationCodeExists(email, verificationCode);
      if (!verificationCodeExists) errors.push('Invalid verification code');
    }

    if (errors.length > 0) return { error: true, errors };

    if (!verificationCode) {
      if (!this.isValidEmail(email)) {
        errors.push('Invalid email');
      }

      const generatedVerificationCode = Math.floor(100000 + Math.random() * 900000);

      const isDelete = await this.Database.executeQuery(
        'INSERT INTO email_verification (email, verification_code) VALUES (?, ?)',
        [email, generatedVerificationCode]
      );
      if (isDelete.error) return { error: true, message: 'Internal server error' };

      sendEmail(email, 'Verification Code', `Your verification code is: ${generatedVerificationCode}`);
      console.log(generatedVerificationCode);

      if (errors.length > 0) return { error: true, errors };

      return { error: false, message: 'Verification code sent' };
    } else {
      const hashedPassword = await crypt.hash(password, 10);

      const newUser = {
        first_name: first_name,
        last_name: '',
        email: email,
        role: 1,
        password: hashedPassword,
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      // Delete the verification code from the database
      const isDelete = await this.Database.executeQuery('DELETE FROM email_verification WHERE email = ?', [email]);
      if (isDelete.error) return { error: true, message: 'Internal server error' };

      const insertUserResult = await this.Database.executeQuery('INSERT INTO users SET ?', newUser);
      if (insertUserResult.error) return { error: true, message: 'Internal server error' };

      return insertUserResult.result.insertId
        ? { error: false, message: ['User created successful'] }
        : { error: true, errors: ['User creation error'] };
    }
  };

  // Function to verify email format
  private isValidEmail(email: string): boolean {
    // Regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Function to verify if the verification code exists in the database
  private async verifyVerificationCodeExists(email: string, verificationCode: number): Promise<any> {
    const result = await this.Database.executeQuery(
      'SELECT * FROM email_verification WHERE email = ? AND verification_code = ?',
      [email, verificationCode]
    );
    if (result.error) return { error: true, message: 'Internal server error' };
    return result.result.length > 0;
  }

  public loginUserRepository = async (login: Login) => {
    const { first_name, password } = login;
    const userPassword = await this.Database.loginUser(first_name);

    if (userPassword.result) {
      const result = await crypt.compare(password, userPassword.result);
      if (result) {
        const token = _token.sign({ first_name: first_name }, process.env.SECRET_KEY || 'enterkey');
        return { token };
      } else {
        return { msg: 'Wrong Password' };
      }
    } else {
      return { msg: 'User does not exist' };
    }
  };
}
