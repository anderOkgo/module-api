import User from '../../domain/models/User';
import Login from '../../domain/models/Login';
export interface UserRepository {
  addUser(user: User): any;
  loginUser(login: Login): any;
}
