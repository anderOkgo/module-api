import { crypt } from '../../../helpers/crypt.helper';
import { Database, HDB } from '../../../helpers/my.database.helper';
import { token } from '../../../helpers/token.helper';
import Login from '../domain/models/Login';
import User from '../domain/models/User';
import { UserRepository } from './repositories/user.repository';
import sendEmail from '../../../helpers/email.helper';
import { validateEmail, validateUsername, validateVerificationCode, userInfo } from './user.mysql.validations';

export class userMysqlRepository implements UserRepository {
  private Database: any;

  constructor() {
    this.Database = new Database('MYDATABASEAUTH');
  }

  public addUserRepository = async (user: User) => {
    const { username, password, email, verificationCode } = user;
    const errors: string[] = [];

    const emailError = await validateEmail(email, this.Database, HDB);
    if (emailError) errors.push(emailError);

    const usernameError = await validateUsername(username, this.Database, HDB);
    if (usernameError) errors.push(usernameError);

    const verificationCodeError = await validateVerificationCode(email, verificationCode || 0, this.Database);
    if (verificationCodeError) errors.push(verificationCodeError);

    if (errors.length > 0) return { error: true, errors };

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
        password: await crypt.hash(password, 10),
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      const isDelete = await this.Database.executeSafeQuery(sqlDelEmailVerification, [email]);
      const insertUserResult = await this.Database.executeSafeQuery(sqlInsUser, newUser);
      if (insertUserResult.insertId) return { error: false, message: 'User created successfully' };
    }
  };

  public loginUserRepository = async (login: Login) => {
    const { username, password } = login;
    const user = await userInfo(username, this.Database);

    if (user) {
      try {
        const result = await crypt.compare(password, user.password);
        return result
          ? {
              error: false,
              token: token.sign({ username: username, role: user.role }, process.env.SECRET_KEY || 'enterkey'),
            }
          : { error: true, message: 'Wrong Password' };
      } catch (error) {
        console.error('Error comparing passwords:', error);
        return { errorSys: true, message: 'Intenal Server Error' };
      }
    } else {
      return { error: true, message: 'User does not exist' };
    }
  };
}
