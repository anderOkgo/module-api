import { addUserPersistence as x, loginUserPersistence as y } from './auth.service';
import { userMysqlRepository } from '../../infrastructure/user.mysql';
const userRepo = new userMysqlRepository();
let addUser = x(userRepo);
let loginUser = y(userRepo);
export { addUser, loginUser };
