import { crypt } from '../../../helpers/crypt.helper';
import { Database, HDB } from '../../../helpers/my.database.helper';
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
    const { first_name, password, email, verificationCode } = user;
    const errors: string[] = [];
    const sqlEmail = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('email')}`;
    const sqluser = `SELECT * FROM users WHERE 1 ${HDB.generateEqualCondition('first_name')}`;
    const sqlInsEmailVerification = `INSERT INTO email_verification (email, verification_code) VALUES (?, ?)`;
    const sqlDelEmailVerification = `DELETE FROM email_verification WHERE email = ?`;
    const sqlInsUser = `INSERT INTO users SET ?`;
    const sqlEmailVerification = `SELECT * FROM email_verification WHERE email = ? AND verification_code = ?`;

    const existingEmail = await this.Database.executeSafeQuery(sqlEmail, [email]);
    if (existingEmail.error) return { error: true, message: 'Internal server error' };
    if (existingEmail.length > 0) errors.push('Email already exists');

    const existingUser = await this.Database.executeSafeQuery(sqluser, [first_name]);
    if (existingUser.error) return { error: true, message: 'Internal server error' };
    if (existingUser.length > 0) errors.push('User already exists');

    if (verificationCode) {
      const result = await this.Database.executeSafeQuery(sqlEmailVerification, [email, verificationCode]);
      if (result.error) return { error: true, message: 'Internal server error' };
      if (!(result.length > 0)) errors.push('Invalid verification code');
    }

    if (errors.length > 0) return { error: true, errors };

    if (!verificationCode) {
      const generatedVerificationCode = Math.floor(100000 + Math.random() * 900000);
      const verifyArray = [email, generatedVerificationCode];
      const isDelete = await this.Database.executeSafeQuery(sqlInsEmailVerification, verifyArray);
      if (isDelete.error) return { error: true, message: 'Internal server error' };

      sendEmail(email, 'Verification Code', `Your verification code is: ${generatedVerificationCode}`);
      console.log(generatedVerificationCode);

      if (errors.length > 0) return { error: true, errors };

      return { error: false, message: 'Verification code sent' };
    } else {
      const newUser = {
        first_name: first_name,
        last_name: '',
        email: email,
        role: 1,
        password: await crypt.hash(password, 10),
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      const isDelete = await this.Database.executeSafeQuery(sqlDelEmailVerification, [email]);
      if (isDelete.error) return { error: true, message: 'Internal server error' };

      const insertUserResult = await this.Database.executeSafeQuery(sqlInsUser, newUser);
      if (insertUserResult.error) return { error: true, message: 'Internal server error' };

      if (insertUserResult.insertId) return { error: false, message: ['User created successful'] };
    }
  };

  public loginUserRepository = async (login: Login) => {
    const { first_name, password } = login;
    const userPassword = await this.Database.loginUser(first_name);

    if (userPassword) {
      const result = await crypt.compare(password, userPassword);
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
