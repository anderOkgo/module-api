import { userMysqlRepository } from '../../../../src/modules/auth/infrastructure/user.mysql';
import User from '../../../../src/modules/auth/domain/models/User';
import Login from '../../../../src/modules/auth/domain/models/Login';
import { crypt } from '../../../../src/infrastructure/crypt.helper';
import { token } from '../../../../src/infrastructure/token.helper';
import sendEmail from '../../../../src/infrastructure/email.helper';

// Mock dependencies
jest.mock('../../../../src/infrastructure/crypt.helper', () => ({
  crypt: {
    hash: jest.fn().mockResolvedValue('hashedpassword'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../../../src/infrastructure/token.helper', () => ({
  token: {
    sign: jest.fn().mockReturnValue('mocked-token'),
  },
}));

jest.mock('../../../../src/infrastructure/email.helper', () =>
  jest.fn().mockImplementation(() => Promise.resolve())
);

jest.mock('../../../../src/infrastructure/my.database.helper', () => ({
  Database: jest.fn().mockImplementation(() => ({
    executeSafeQuery: jest.fn().mockResolvedValue([]),
  })),
  HDB: {
    generateEqualCondition: jest.fn().mockReturnValue('= ?'),
  },
}));

// Import the mocked modules
import { Database, HDB } from '../../../../src/infrastructure/my.database.helper';

// Test suite for userMysqlRepository
describe('userMysqlRepository', () => {
  let repository: userMysqlRepository;
  let mockUser: User;
  let mockLogin: Login;
  let mockExecuteSafeQuery: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get reference to the mock function
    const MockDatabase = Database as jest.Mock;
    mockExecuteSafeQuery = jest.fn().mockResolvedValue([]);
    MockDatabase.mockImplementation(() => ({
      executeSafeQuery: mockExecuteSafeQuery,
    }));

    repository = new userMysqlRepository();

    // Set up mockUser without verificationCode to trigger code generation
    mockUser = {
      username: 'testuser',
      password: 'password123',
      email: 'test@example.com',
      verificationCode: undefined, // Important: undefined to trigger code generation path
    } as User;

    mockLogin = { username: 'testuser', password: 'password123' } as Login;
  });

  describe('addUser', () => {
    it('should add a user and send a verification code', async () => {
      // Set up mock responses for validation checks
      mockExecuteSafeQuery
        .mockResolvedValueOnce([]) // Email validation - no existing email
        .mockResolvedValueOnce([]) // Username validation - no existing username
        .mockResolvedValueOnce([]); // Success for insert operation

      const result = await repository.addUser(mockUser);
      expect(result?.error).toBe(false);
      expect(result?.message).toBe('Verification code sent');
      expect(sendEmail).toHaveBeenCalled();
    });

    it('should return an error if email already exists', async () => {
      // Mock email validation failure - email exists
      mockExecuteSafeQuery.mockResolvedValueOnce([{ email: 'test@example.com' }]);

      const result = await repository.addUser(mockUser);
      expect(result?.error).toBe(true);
      expect(result?.message).toContain('Email already exists');
    });
  });

  describe('loginUser', () => {
    it('should login a user and return a token', async () => {
      mockExecuteSafeQuery.mockResolvedValueOnce([{ username: 'testuser', password: 'hashedpassword', role: 2 }]);

      const result = await repository.loginUser(mockLogin);
      expect(result?.error).toBe(false);
      expect(result?.token).toBeDefined();
    });

    it('should return an error if password is wrong', async () => {
      mockExecuteSafeQuery.mockResolvedValueOnce([{ username: 'testuser', password: 'hashedpassword', role: 2 }]);

      (crypt.compare as jest.Mock).mockResolvedValueOnce(false);

      const result = await repository.loginUser(mockLogin);
      expect(result?.error).toBe(true);
      expect(result?.message).toBe('Wrong Password');
    });
  });
});
