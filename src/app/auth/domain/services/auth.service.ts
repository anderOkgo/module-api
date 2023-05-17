import { UserRepository } from '../../domain/user.repository';
import User from '../models/User';
import Login from '../models/Login';

const addUserPersistence = (userRepository: UserRepository) => (user: User) =>
  userRepository.addUserRepository(user);

const loginUserPersistence = (userRepository: UserRepository) => (login: Login) =>
  userRepository.loginUserRepository(login);

export { addUserPersistence, loginUserPersistence };
