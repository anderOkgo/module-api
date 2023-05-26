import { addUserService, loginUserService } from './auth.service';
import { userMysqlRepository } from '../../infrastructure/user.mysql';
const userRepo = new userMysqlRepository();
let addUser = addUserService(userRepo);
let loginUser = loginUserService(userRepo);
export { addUser, loginUser };
