import { UserRepository } from '../../infrastructure/repositories/user.repository';
import User from '../models/User';
import Login from '../models/Login';

export const addUserService = (userRepository: UserRepository) => (user: User) =>
  userRepository.addUserRepository(user);

export const loginUserService = (userRepository: UserRepository) => (login: Login) =>
  userRepository.loginUserRepository(login);
