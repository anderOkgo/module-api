import { UserRepository } from '../../../../../src/app/auth/infrastructure/repositories/user.repository';
import { addUser, loginUser } from '../../../../../src/app/auth/domain/services/auth.service';
import User from '../../../../../src/app/auth/domain/models/User';
import Login from '../../../../../src/app/auth/domain/models/Login';

// Manually mock UserRepository
const mockUserRepository: UserRepository = {
  addUser: jest.fn(),
  loginUser: jest.fn(),
};

describe('User Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call addUser when addUser is called', () => {
    const userService = addUser(mockUserRepository);
    const user: User = {
      first_name: 'string',
      last_name: 'string',
      username: 'string',
      email: 'string',
      role: 1,
      password: 'string',
      active: 1,
      created: 'string',
      modified: 'string',
    };

    userService(user);

    expect(mockUserRepository.addUser).toHaveBeenCalledWith(user);
  });

  it('should call loginUser when loginUser is called', () => {
    const userService = loginUser(mockUserRepository);
    const login: Login = {
      username: 'anderokg',
      password: '123',
    };

    userService(login);

    expect(mockUserRepository.loginUser).toHaveBeenCalledWith(login);
  });
});
