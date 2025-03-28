import * as service from './auth.service';
import { userRepository } from '../../infrastructure/index';

const userRepo = new userRepository();

export const addUserService = service.addUser(userRepo);
export const loginUserService = service.loginUser(userRepo);
