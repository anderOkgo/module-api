import { userMysqlRepository } from '../../../../src/modules/auth/infrastructure/user.mysql';
import User from '../../../../src/modules/auth/domain/models/User';
import Login from '../../../../src/modules/auth/domain/models/Login';
import { crypt } from '../../../../src/infrastructure/crypt.helper';
import { Database } from '../../../../src/infrastructure/my.database.helper';
import { token } from '../../../../src/infrastructure/token.helper';
import sendEmail from '../../../../src/infrastructure/email.helper';

// Mock the dependencies
jest.mock('../../../../src/infrastructure/crypt.helper');
jest.mock('../../../../src/infrastructure/my.database.helper');
jest.mock('../../../../src/infrastructure/token.helper');
jest.mock('../../../../src/infrastructure/email.helper');

describe('userMysqlRepository', () => {
  let userRepository: userMysqlRepository;
  let mockExecuteSafeQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    userRepository = new userMysqlRepository();
    mockExecuteSafeQuery = jest.fn();
    (Database as jest.Mock).mockImplementation(() => ({
      executeSafeQuery: mockExecuteSafeQuery,
    }));
  });

  describe('addUser', () => {
    it('should send verification code when first registering', async () => {
      const user: User = {
        first_name: '',
        last_name: '',
        username: 'testuser',
        email: 'test@example.com',
        role: 2,
        password: 'password123',
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      // Mock validation functions to return no errors
      mockExecuteSafeQuery
        .mockResolvedValueOnce([]) // email validation
        .mockResolvedValueOnce([]) // username validation
        .mockResolvedValueOnce(true); // insert verification code

      const result = await userRepository.addUser(user);

      expect(result?.error).toBeFalsy();
      expect(result?.message).toBe('Verification code sent');
      expect(sendEmail).toHaveBeenCalled();
      expect(mockExecuteSafeQuery).toHaveBeenCalledTimes(3);
    });

    it('should create user when verification code is provided', async () => {
      const user: User = {
        first_name: '',
        last_name: '',
        username: 'testuser',
        email: 'test@example.com',
        role: 2,
        password: 'password123',
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        verificationCode: 123456,
      };

      // Mock validation functions to return no errors
      mockExecuteSafeQuery
        .mockResolvedValueOnce([]) // email validation
        .mockResolvedValueOnce([]) // username validation
        .mockResolvedValueOnce([{ verification_code: 123456 }]) // verification code validation
        .mockResolvedValueOnce(true) // delete verification code
        .mockResolvedValueOnce({ insertId: 1 }); // insert user

      (crypt.hash as jest.Mock).mockResolvedValue('hashedpassword');

      const result = await userRepository.addUser(user);

      expect(result?.error).toBeFalsy();
      expect(result?.message).toBe('User created successfully');
      expect(crypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should return validation errors when present', async () => {
      const user: User = {
        first_name: '',
        last_name: '',
        username: 'testuser',
        email: 'test@example.com',
        role: 2,
        password: 'password123',
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      mockExecuteSafeQuery
        .mockResolvedValueOnce([{ email: 'test@example.com' }]) // email already exists
        .mockResolvedValueOnce([{ username: 'testuser' }]); // username already exists

      const result = await userRepository.addUser(user);

      expect(result?.error).toBeTruthy();
      expect(Array.isArray(result?.message)).toBeTruthy();
    });
  });

  describe('loginUser', () => {
    it('should successfully login user with correct credentials', async () => {
      const login: Login = {
        username: 'testuser',
        password: 'correctpassword',
      };

      const mockUser = {
        username: 'testuser',
        password: 'hashedpassword',
        role: 2,
        first_name: '',
        last_name: '',
        email: 'test@example.com',
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      mockExecuteSafeQuery.mockResolvedValueOnce([mockUser]);
      (crypt.compare as jest.Mock).mockResolvedValueOnce(true);
      (token.sign as jest.Mock).mockReturnValueOnce('generated_token');

      const result = await userRepository.loginUser(login);

      expect(result.error).toBeFalsy();
      expect(result.token).toBe('generated_token');
      expect(token.sign).toHaveBeenCalledWith({ username: 'testuser', role: 2 }, expect.any(String));
    });

    it('should return error for wrong password', async () => {
      const login: Login = {
        username: 'testuser',
        password: 'wrongpassword',
      };

      const mockUser = {
        username: 'testuser',
        password: 'hashedpassword',
        role: 2,
        first_name: '',
        last_name: '',
        email: 'test@example.com',
        active: 1,
        created: new Date().toISOString().replace('T', ' ').replace('Z', ''),
        modified: new Date().toISOString().replace('T', ' ').replace('Z', ''),
      };

      mockExecuteSafeQuery.mockResolvedValueOnce([mockUser]);
      (crypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await userRepository.loginUser(login);

      expect(result.error).toBeTruthy();
      expect(result.message).toBe('Wrong Password');
    });

    it('should return error for non-existent user', async () => {
      const login: Login = {
        username: 'nonexistent',
        password: 'password123',
      };

      mockExecuteSafeQuery.mockResolvedValueOnce([]);

      const result = await userRepository.loginUser(login);

      expect(result.error).toBeTruthy();
      expect(result.message).toBe('User does not exist');
    });
  });
});
