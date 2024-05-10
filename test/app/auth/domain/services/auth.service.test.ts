import { UserRepository } from '../../../../../src/app/auth/infrastructure/repositories/user.repository';
import { addUserService, loginUserService } from '../../../../../src/app/auth/domain/services/auth.service';
import User from '../../../../../src/app/auth/domain/models/User';
import Login from '../../../../../src/app/auth/domain/models/Login';

// Manually mock UserRepository
const mockUserRepository: UserRepository = {
  addUserRepository: jest.fn(),
  loginUserRepository: jest.fn(),
};

describe('User Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call addUserRepository when addUserService is called', () => {
    const userService = addUserService(mockUserRepository);
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

    expect(mockUserRepository.addUserRepository).toHaveBeenCalledWith(user);
  });

  it('should call loginUserRepository when loginUserService is called', () => {
    const userService = loginUserService(mockUserRepository);
    const login: Login = {
      username: 'anderokg',
      password: '123',
    };

    userService(login);

    expect(mockUserRepository.loginUserRepository).toHaveBeenCalledWith(login);
  });
});
