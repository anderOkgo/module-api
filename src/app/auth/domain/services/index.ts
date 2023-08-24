import { addUserService, loginUserService } from './auth.service';
import { userRepository } from '../../infrastructure/index';
const userRepo = new userRepository();
let addUser = addUserService(userRepo);
let loginUser = loginUserService(userRepo);
export { addUser, loginUser };
