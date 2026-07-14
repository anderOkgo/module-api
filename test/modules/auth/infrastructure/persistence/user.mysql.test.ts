import { userMysqlRepository } from '../../../../../src/modules/auth/infrastructure/persistence/user.mysql';
import { Database } from '../../../../../src/infrastructure/my.database.helper';
import User from '../../../../../src/modules/auth/domain/entities/user.entity';

jest.mock('../../../../../src/infrastructure/my.database.helper');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('userMysqlRepository', () => {
  let repository: userMysqlRepository;
  let mockDatabase: jest.Mocked<Database>;

  const sampleUser = {
    id: 1,
    first_name: 'Test',
    last_name: 'User',
    username: 'testuser',
    email: 'test@example.com',
    role: 2,
    password: 'hashed',
    active: true,
  } as User;

  beforeEach(() => {
    mockDatabase = { executeSafeQuery: jest.fn() } as any;
    MockedDatabase.mockImplementation(() => mockDatabase);
    repository = new userMysqlRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('inserts the user and returns the freshly-created record', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ insertId: 1 }) // INSERT
        .mockResolvedValueOnce([sampleUser]); // findById

      const result = await repository.create(sampleUser);

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenNthCalledWith(1, 'INSERT INTO users SET ?', sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenNthCalledWith(2, 'SELECT * FROM users WHERE id = ?', [1]);
    });

    it('throws when the insert reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true });

      await expect(repository.create(sampleUser)).rejects.toThrow('Error creating user');
    });

    it('throws when the user cannot be re-fetched right after creation', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ insertId: 1 })
        .mockResolvedValueOnce([]); // findById returns nothing

      await expect(repository.create(sampleUser)).rejects.toThrow('User created but not found');
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([sampleUser]);

      const result = await repository.findById(1);

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE id = ?', [1]);
    });

    it('returns null when not found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      expect(await repository.findById(999)).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([sampleUser]);

      const result = await repository.findByEmail('test@example.com');

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
        'test@example.com',
      ]);
    });

    it('returns null when not found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      expect(await repository.findByEmail('ghost@example.com')).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('returns the user when found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([sampleUser]);

      const result = await repository.findByUsername('testuser');

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', [
        'testuser',
      ]);
    });

    it('returns null when not found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      expect(await repository.findByUsername('ghost')).toBeNull();
    });
  });

  describe('findByEmailOrUsername', () => {
    it('prioritizes a match by username over email', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([sampleUser]); // findByUsername hit

      const result = await repository.findByEmailOrUsername('test@example.com', 'testuser');

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?', [
        'testuser',
      ]);
    });

    it('falls back to email when the username does not match', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([]) // findByUsername miss
        .mockResolvedValueOnce([sampleUser]); // findByEmail hit

      const result = await repository.findByEmailOrUsername('test@example.com', 'unknown');

      expect(result).toEqual(sampleUser);
    });

    it('skips the username lookup entirely when username is empty', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([sampleUser]); // findByEmail hit

      const result = await repository.findByEmailOrUsername('test@example.com', '');

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM users WHERE email = ?', [
        'test@example.com',
      ]);
    });

    it('returns null when neither username nor email is provided', async () => {
      const result = await repository.findByEmailOrUsername('', '');

      expect(result).toBeNull();
      expect(mockDatabase.executeSafeQuery).not.toHaveBeenCalled();
    });

    it('returns null when username misses and email is empty too', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([]); // findByUsername miss

      const result = await repository.findByEmailOrUsername('', 'unknown');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('throws when the user has no id', async () => {
      await expect(repository.update({ first_name: 'No Id' })).rejects.toThrow(
        'User ID is required for update'
      );
      expect(mockDatabase.executeSafeQuery).not.toHaveBeenCalled();
    });

    it('updates the user and returns the refreshed record', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ affectedRows: 1 }) // UPDATE
        .mockResolvedValueOnce([sampleUser]); // findById

      const result = await repository.update({ id: 1, first_name: 'Updated' });

      expect(result).toEqual(sampleUser);
      expect(mockDatabase.executeSafeQuery).toHaveBeenNthCalledWith(1, 'UPDATE users SET ? WHERE id = ?', [
        { id: 1, first_name: 'Updated' },
        1,
      ]);
    });

    it('throws when the user cannot be found after the update', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce({ affectedRows: 1 }).mockResolvedValueOnce([]);

      await expect(repository.update({ id: 999 })).rejects.toThrow('User not found after update');
    });
  });

  describe('delete', () => {
    it('returns true when a row was deleted', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      expect(await repository.delete(1)).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [1]);
    });

    it('returns false when no row was affected', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 0 });

      expect(await repository.delete(999)).toBe(false);
    });
  });

  describe('authentication-support methods', () => {
    it('updatePassword issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.updatePassword(1, 'newHash');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE users SET password = ?, modified = NOW() WHERE id = ?',
        ['newHash', 1]
      );
    });

    it('updateLastLogin issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.updateLastLogin(1);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [1]
      );
    });

    it('incrementLoginAttempts issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.incrementLoginAttempts(1);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE users SET login_attempts = COALESCE(login_attempts, 0) + 1 WHERE id = ?',
        [1]
      );
    });

    it('resetLoginAttempts issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.resetLoginAttempts(1);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?',
        [1]
      );
    });

    it('lockUser issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});
      const lockUntil = new Date('2026-01-01T00:00:00.000Z');

      await repository.lockUser(1, lockUntil);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('UPDATE users SET locked_until = ? WHERE id = ?', [
        lockUntil,
        1,
      ]);
    });

    it('unlockUser issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.unlockUser(1);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE users SET locked_until = NULL WHERE id = ?',
        [1]
      );
    });
  });

  describe('verification code methods', () => {
    it('saveVerificationCode issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.saveVerificationCode('test@example.com', 123456);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'INSERT INTO email_verification (email, verification_code) VALUES (?, ?)',
        ['test@example.com', 123456]
      );
    });

    it('validateVerificationCode returns true when a matching row exists', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([{ email: 'test@example.com' }]);

      expect(await repository.validateVerificationCode('test@example.com', 123456)).toBe(true);
    });

    it('validateVerificationCode returns false when no matching row exists', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      expect(await repository.validateVerificationCode('test@example.com', 999999)).toBe(false);
    });

    it('deleteVerificationCode issues the expected query', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.deleteVerificationCode('test@example.com');

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'DELETE FROM email_verification WHERE email = ?',
        ['test@example.com']
      );
    });
  });
});
