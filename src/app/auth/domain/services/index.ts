import { addUserService, loginUserService } from './auth.service';
import { userRepository } from '../../infrastructure/index';

const userRepo = new userRepository();

export const addUser = addUserService(userRepo);
export const loginUser = loginUserService(userRepo);
