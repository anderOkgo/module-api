import { userMysqlRepository } from '../../../../src/modules/auth/infrastructure/user.mysql';
import User from '../../../../src/modules/auth/domain/models/User';
import Login from '../../../../src/modules/auth/domain/models/Login';
import { crypt } from '../../../../src/infrastructure/crypt.helper';
import { Database } from '../../../../src/infrastructure/my.database.helper';
import { token } from '../../../../src/infrastructure/token.helper';

// Mock the dependencies (crypt, Database, token)
jest.mock('../../../../src/infrastructure/crypt.helper');
jest.mock('../../../../src/infrastructure/my.database.helper');
jest.mock('../../../../src/infrastructure/token.helper');

describe('userMysqlRepository', () => {
  let userRepository: userMysqlRepository;

  beforeEach(() => {
    userRepository = new userMysqlRepository();
  });

  it('should add a user to the database', async () => {
    const user: User = {
      first_name: 'testuser',
      last_name: 'string',
      username: 'string',
      email: 'string',
      role: 1,
      password: 'string',
      active: 1,
      created: 'string',
      modified: 'string',
    };
    // Mock the behavior of dependencies
    (crypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({ insertId: 1 });

    const userId = await userRepository.addUserRepository(user);

    expect(userId).toBe(1);
    expect(crypt.hash).toHaveBeenCalledWith('string', 10);
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith('INSERT INTO users SET ?', {
      first_name: 'testuser',
      last_name: '',
      username: '',
      email: '',
      role: 1,
      password: 'hashedpassword',
      active: 1,
      created: '2018-01-18',
      modified: '2018-01-18',
    });
  });

  it('should log in a user', async () => {
    const login: Login = {
      username: 'testuser',
      password: 'testpassword',
    };

    // Mock the behavior of dependencies
    (Database.prototype.loginUser as jest.Mock).mockResolvedValue('hashedpassword');
    (crypt.compare as jest.Mock).mockResolvedValue(true);
    (token.sign as jest.Mock).mockReturnValue('testtoken');

    const result = await userRepository.loginUserRepository(login);

    expect(result).toEqual({ token: 'testtoken' });
    expect(Database.prototype.loginUser).toHaveBeenCalledWith('testuser');
    expect(crypt.compare).toHaveBeenCalledWith('testpassword', 'hashedpassword');
    expect(token.sign).toHaveBeenCalledWith({ username: 'testuser' }, 'enterkey');
  });

  it('should handle login failure due to wrong password', async () => {
    const login: Login = {
      username: 'testuser',
      password: 'testpassword',
    };

    // Mock the behavior of dependencies
    (Database.prototype.loginUser as jest.Mock).mockResolvedValue('hashedpassword');
    (crypt.compare as jest.Mock).mockResolvedValue(false);

    const result = await userRepository.loginUserRepository(login);

    expect(result).toEqual({ msg: 'Wrong Password' });
  });

  it('should handle login failure due to user not existing', async () => {
    const login: Login = {
      username: 'nonexistentuser',
      password: 'testpassword',
    };

    // Mock the behavior of dependencies
    (Database.prototype.loginUser as jest.Mock).mockResolvedValue(null);

    const result = await userRepository.loginUserRepository(login);

    expect(result).toEqual({ msg: 'User does not exist' });
  });
});
