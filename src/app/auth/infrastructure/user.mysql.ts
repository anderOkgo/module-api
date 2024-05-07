import { crypt } from '../../../helpers/crypt.helper';
import { Database } from '../../../helpers/my.database.helper';
import { token as _token } from '../../../helpers/token.helper';
import Login from '../domain/models/Login';
import User from '../domain/models/User';
import { UserRepository } from './repositories/user.repository';
import { handleSystemErrors, systemErrors } from './errorHandler'; // Importing system errors and error handler

export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  public addUserRepository = async (user: User) => {
    // Check if user object is empty
    if (Object.keys(user).length === 0) {
      return { error: true, errors: ['User object is empty'] };
    }

    const { first_name, password, email, verificationCode } = user;
    const errors: string[] = [];

    // Check if email exists in the database
    const existingEmail = await this.Database.executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existingEmail.error) {
      // Check if an error occurred
      systemErrors.push(existingEmail.message); // Accumulate system errors
    }
    if (existingEmail.result.length > 0) {
      errors.push('Email already exists');
    }

    // Check if user exists in the database
    const existingUser = await this.Database.executeQuery('SELECT * FROM users WHERE first_name = ?', [
      first_name,
    ]);
    if (existingUser.error) {
      // Check if an error occurred
      systemErrors.push(existingUser.message); // Accumulate system errors
    }
    if (existingUser.result.length > 0) {
      errors.push('User already exists');
    }

    // If verification code is provided, verify its existence
    if (verificationCode) {
      const verificationCodeExists = await this.verifyVerificationCodeExists(email, verificationCode);
      if (!verificationCodeExists) {
        errors.push('Invalid verification code');
      }
    }

    // If there are any errors, return them
    if (errors.length > 0) {
      return { error: true, errors };
    }

    // If verification code is not provided, validate email, generate verification code, and send
    if (!verificationCode) {
      // Check if email is valid
      if (!this.isValidEmail(email)) {
        errors.push('Invalid email');
      }

      // Generate a random verification code
      const generatedVerificationCode = Math.floor(100000 + Math.random() * 900000); // Generates a random 6-digit number

      // Store the verification code in the database
      const verificationCodeInsertResult = await this.Database.executeQuery(
        'INSERT INTO email_verification (email, verification_code) VALUES (?, ?)',
        [email, generatedVerificationCode]
      );
      if (verificationCodeInsertResult.error) {
        // Check if an error occurred
        systemErrors.push(verificationCodeInsertResult.message); // Accumulate system errors
      }

      // Send the verification code to the provided email address
      //sendEmail(email, 'Verification Code', `Your verification code is: ${generatedVerificationCode}`);
      console.log(generatedVerificationCode);

      // If there are any errors, return them
      if (errors.length > 0) {
        return { error: true, errors };
      }

      return { error: false, message: 'Verification code sent' };
    } else {
      // Hash the password
      const hashedPassword = await crypt.hash(password, 10);

      // Prepare user object for insertion
      const newUser = {
        first_name: first_name,
        last_name: '',
        email: email,
        role: 1,
        password: hashedPassword,
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''), // Correctly format the datetime value
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''), // Correctly format the datetime value
      };

      // Delete the verification code from the database
      const deleteVerificationCodeResult = await this.Database.executeQuery(
        'DELETE FROM email_verification WHERE email = ?',
        [email]
      );
      if (deleteVerificationCodeResult.error) {
        // Check if an error occurred
        systemErrors.push(deleteVerificationCodeResult.message); // Accumulate system errors
      }

      // Insert new user into the database
      const insertUserResult = await this.Database.executeQuery('INSERT INTO users SET ?', newUser);
      if (insertUserResult.error) {
        // Check if an error occurred
        systemErrors.push(insertUserResult.message); // Accumulate system errors
      }

      if (systemErrors.length > 0) {
        handleSystemErrors();
        return { error: false, message: 'Internal server error' };
      }

      // Return the response after processing all steps
      return insertUserResult.result.insertId
        ? { error: false, message: 'Insert successful' }
        : { error: true, errors: ['Insert error'] };
    }
  };

  // Function to verify email format
  private isValidEmail(email: string): boolean {
    // Regular expression to validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Function to verify if the verification code exists in the database
  private async verifyVerificationCodeExists(email: string, verificationCode: number): Promise<boolean> {
    const result = await this.Database.executeQuery(
      'SELECT * FROM email_verification WHERE email = ? AND verification_code = ?',
      [email, verificationCode]
    );
    return result.error ? false : result.result.length > 0;
  }

  public loginUserRepository = async (login: Login) => {
    const { first_name, password } = login;
    const userPassword = await this.Database.loginUser(first_name);

    if (userPassword.error) {
      // Check if an error occurred
      systemErrors.push(userPassword.message); // Accumulate system errors
      return { error: true, message: 'Internal server error' };
    }

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
