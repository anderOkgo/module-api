import User from '../models/User';
import Login from '../models/Login';
export interface UserRepository {
  addUserRepository(user: User): any;
  loginUserRepository(login: Login): any;
}
