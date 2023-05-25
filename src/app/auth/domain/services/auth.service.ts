import { UserRepository } from '../repositories/user.repository';
import User from '../models/User';
import Login from '../models/Login';

const addUserService = (userRepository: UserRepository) => (user: User) =>
  userRepository.addUserRepository(user);

const loginUserService = (userRepository: UserRepository) => (login: Login) =>
  userRepository.loginUserRepository(login);

export { addUserService, loginUserService };
