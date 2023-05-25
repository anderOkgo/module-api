import Database from '../../../data/mysql/database';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../domain/repositories/user.repository';
import User from '../domain/models/User';
import Login from '../domain/models/Login';

export class userMysqlRepository implements UserRepository {
  private connection: any;

  constructor() {
    this.connection = new Database();
  }

  public addUserRepository = async (user: User) => {
    const { first_name, password } = user;
    const hashedPassword = await bcrypt.hash(password, 10);
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

    const result = await this.connection.executeQuery('INSERT INTO users SET ?', newUser);
    return result.insertId;
  };

  public loginUserRepository = async (login: Login) => {
    const { first_name, password } = login;
    const userPassword = await this.connection.loginUser(first_name);

    if (userPassword) {
      const result = await bcrypt.compare(password, userPassword);
      if (result) {
        const token = jwt.sign({ first_name: first_name }, process.env.SECRET_KEY || 'enterkey');
        return { token };
      } else {
        return { msg: 'Wrong Password' };
      }
    } else {
      return { msg: 'User does not exist' };
    }
  };
}
