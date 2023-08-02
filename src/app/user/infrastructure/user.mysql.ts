import { crypt } from '../../../helpers/crypt.helper';
import { Database } from '../../../helpers/database.helper';
import { token as _token } from '../../../helpers/token.helper';
import Login from '../domain/models/Login';
import User from '../domain/models/User';
import { UserRepository } from './repositories/user.repository';

export class userMysqlRepository implements UserRepository {
  private Database: any;
  constructor() {
    this.Database = new Database('MYDATABASEANIME');
  }

  public addUserRepository = async (user: User) => {
    const { first_name, password } = user;
    const hashedPassword = await crypt.hash(password, 10);
    const newUser = {
      first_name: first_name,
      last_name: '',
      email: '',
      role: 1,
      password: hashedPassword,
      active: 1,
      created: '2018-01-18',
      modified: '2018-01-18',
    };

    const result = await this.Database.executeQuery('INSERT INTO users SET ?', newUser);
    return result.insertId;
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
