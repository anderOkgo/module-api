import { userMysqlRepository } from '../../../../src/app/auth/infrastructure/user.mysql';
import { Database } from '../../../../src/helpers/my.database.helper';
import { crypt } from '../../../../src/helpers/crypt.helper';
import { token } from '../../../../src/helpers/token.helper';
import User from '../../../../src/app/auth/domain/models/User';
import sendEmail from '../../../../src/helpers/email.helper';

// Mock the dependencies
jest.mock('../../../../src/helpers/my.database.helper');
jest.mock('../../../../src/helpers/crypt.helper', () => ({
  crypt: {
    hash: jest.fn(),
    compare: jest.fn(),
  },
}));
jest.mock('../../../../src/helpers/token.helper', () => ({
  token: {
    sign: jest.fn(),
  },
}));
jest.mock('../../../../src/helpers/email.helper', () => jest.fn());

describe('userMysqlRepository', () => {
  let userRepository: userMysqlRepository;

  beforeEach(() => {
    userRepository = new userMysqlRepository();
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('addUser', () => {
    it('should send verification code when no code is provided', async () => {
      const user: User = {
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        role: 1,
        password: 'string',
        active: 1,
        created: '2024-01-01',
        modified: '2024-01-01',
      };

      // Mock the behavior of dependencies
      (Database.prototype.executeSafeQuery as jest.Mock)
        .mockResolvedValueOnce([]) // validateEmail
        .mockResolvedValueOnce([]) // validateUsername
        .mockResolvedValueOnce({ affectedRows: 1 }); // insertEmailVerification

      const result = await userRepository.addUser(user);

      expect(result).toEqual({ error: false, message: 'Verification code sent' });
      expect(sendEmail).toHaveBeenCalled();
      expect(Database.prototype.executeSafeQuery).toHaveBeenCalledTimes(3);
    });

    it('should add a user when verification code is provided', async () => {
      const user: User = {
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        role: 1,
        password: 'string',
        active: 1,
        created: '2024-01-01',
        modified: '2024-01-01',
        verificationCode: 123456,
      };

      // Mock the behavior of dependencies
      (Database.prototype.executeSafeQuery as jest.Mock)
        .mockResolvedValueOnce([]) // validateEmail
        .mockResolvedValueOnce([]) // validateUsername
        .mockResolvedValueOnce([{ verification_code: 123456 }]) // validateVerificationCode
        .mockResolvedValueOnce({ affectedRows: 1 }) // deleteEmailVerification
        .mockResolvedValueOnce({ insertId: 1 }); // insertUser
      (crypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await userRepository.addUser(user);

      expect(result).toEqual({ error: false, message: 'User created successfully' });
      expect(crypt.hash).toHaveBeenCalledWith('string', 10);
      expect(Database.prototype.executeSafeQuery).toHaveBeenCalledTimes(5);
    });

    it('should handle validation errors', async () => {
      const user: User = {
        first_name: 'Test',
        last_name: 'User',
        username: 'testuser',
        email: 'test@example.com',
        role: 1,
        password: 'string',
        active: 1,
        created: '2024-01-01',
        modified: '2024-01-01',
        verificationCode: 123456,
      };

      // Mock validation errors
      (Database.prototype.executeSafeQuery as jest.Mock)
        .mockResolvedValueOnce([{ email: 'test@example.com' }]) // validateEmail fails
        .mockResolvedValueOnce([{ username: 'testuser' }]); // validateUsername fails

      const result = await userRepository.addUser(user);

      expect(result).toEqual({
        error: true,
        message: ['Email already exists', 'User already exists'],
      });
    });
  });

  describe('loginUser', () => {
    it('should log in a user successfully', async () => {
      const login = {
        username: 'testuser',
        password: 'password',
      };

      // Mock the behavior of dependencies
      (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([
        { password: 'hashedpassword', role: 1 },
      ]);
      (crypt.compare as jest.Mock).mockResolvedValue(true);
      (token.sign as jest.Mock).mockReturnValue('testtoken');

      const result = await userRepository.loginUser(login);

      expect(result).toEqual({ error: false, token: 'testtoken' });
      expect(crypt.compare).toHaveBeenCalledWith('password', 'hashedpassword');
      expect(token.sign).toHaveBeenCalledWith({ username: 'testuser', role: 1 }, 'enterkey');
    });

    it('should handle wrong password', async () => {
      const login = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      // Mock the behavior of dependencies
      (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([
        { password: 'hashedpassword', role: 1 },
      ]);
      (crypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await userRepository.loginUser(login);

      expect(result).toEqual({ error: true, message: 'Wrong Password' });
    });

    it('should handle non-existent user', async () => {
      const login = {
        username: 'nonexistent',
        password: 'password',
      };

      // Mock the behavior of dependencies
      (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([]);

      const result = await userRepository.loginUser(login);

      expect(result).toEqual({ error: true, message: 'User does not exist' });
    });

    it('should handle password comparison error', async () => {
      const login = {
        username: 'testuser',
        password: 'password',
      };

      // Mock the behavior of dependencies
      (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([
        { password: 'hashedpassword', role: 1 },
      ]);
      (crypt.compare as jest.Mock).mockRejectedValue(new Error('Comparison error'));

      const result = await userRepository.loginUser(login);

      expect(result).toEqual({ errorSys: true, message: 'Intenal Server Error' });
    });
  });
});
