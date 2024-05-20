import { UserRepository } from '../../infrastructure/repositories/user.repository';
import User from '../models/User';
import Login from '../models/Login';

export const addUser = (userRepo: UserRepository) => (user: User) => userRepo.addUser(user);
export const loginUser = (userRepo: UserRepository) => (login: Login) => userRepo.loginUser(login);
