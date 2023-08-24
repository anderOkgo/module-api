import User from '../../domain/models/User';
import Login from '../../domain/models/Login';
export interface UserRepository {
  addUserRepository(user: User): any;
  loginUserRepository(login: Login): any;
}
