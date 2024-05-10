import { crypt } from '../../../helpers/crypt.helper';
import { Database, HDB } from '../../../helpers/my.database.helper';
import { token as _token } from '../../../helpers/token.helper';
import Login from '../domain/models/Login';
import User from '../domain/models/User';
import { UserRepository } from './repositories/user.repository';
import sendEmail from '../../../helpers/email.helper';

export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  public addUserRepository = async (user: User) => {
    const { username, password, email, verificationCode } = user;
    const errors: string[] = [];
    const sqlEmail = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('email')}`;
    const sqluser = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('username')}`;
    const sqlInsEmailVerification = `INSERT INTO email_verification (email, verification_code) VALUES (?, ?)`;
    const sqlDelEmailVerification = `DELETE FROM email_verification WHERE email = ?`;
    const sqlInsUser = `INSERT INTO users SET ?`;
    const sqlEmailVerification = `SELECT * FROM email_verification WHERE email = ? AND verification_code = ?`;

    try {
      const existingEmail = await this.Database.executeQuery(sqlEmail, [email]);
      if (existingEmail.length > 0) errors.push('Email already exists');
    } catch (error) {
      console.error('Error executing SQL query for existingEmail:', error);
      return { error: true, message: 'Internal server error' };
    }

    try {
      const existingUser = await this.Database.executeQuery(sqluser, [username]);
      if (existingUser.length > 0) errors.push('User already exists');
    } catch (error) {
      console.error('Error executing SQL query for existingUser:', error);
      return { error: true, message: 'Internal server error' };
    }

    if (verificationCode) {
      try {
        const result = await this.Database.executeQuery(sqlEmailVerification, [email, verificationCode]);
        if (!(result.length > 0)) errors.push('Invalid verification code');
      } catch (error) {
        console.error('Error executing SQL query for verificationCode:', error);
        return { error: true, message: 'Internal server error' };
      }
    }

    if (errors.length > 0) return { error: true, errors };

    if (!verificationCode) {
      try {
        const generatedVerificationCode = Math.floor(100000 + Math.random() * 900000);
        const verifyArray = [email, generatedVerificationCode];
        const isDelete = await this.Database.executeQuery(sqlInsEmailVerification, verifyArray);
        sendEmail(email, 'Verification Code', `Your verification code is: ${generatedVerificationCode}`);
        console.log(generatedVerificationCode);
      } catch (error) {
        console.error('Error executing SQL query for sending verification email:', error);
        return { error: true, message: 'Internal server error' };
      }

      if (errors.length > 0) return { error: true, errors };

      return { error: false, message: 'Verification code sent' };
    } else {
      const newUser = {
        first_name: '',
        last_name: '',
        username: username,
        email: email,
        role: 1,
        password: await crypt.hash(password, 10),
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      try {
        const isDelete = await this.Database.executeQuery(sqlDelEmailVerification, [email]);
        const insertUserResult = await this.Database.executeQuery(sqlInsUser, newUser);
        if (insertUserResult.insertId) return { error: false, message: ['User created successful'] };
      } catch (error) {
        console.error('Error executing SQL query for creating new user:', error);
        return { error: true, message: 'Internal server error' };
      }
    }
  };

  public loginUserRepository = async (login: Login) => {
    const { username, password } = login;
    const userPassword = await this.Database.loginUser(username);

    if (userPassword) {
      try {
        const result = await crypt.compare(password, userPassword);
        if (result) {
          const token = _token.sign({ username: username }, process.env.SECRET_KEY || 'enterkey');
          return { token };
        } else {
          return { msg: 'Wrong Password' };
        }
      } catch (error) {
        console.error('Error comparing passwords:', error);
        return { error: true, message: 'Internal server error' };
      }
    } else {
      return { msg: 'User does not exist' };
    }
  };
}
