import { UserKeysMysqlRepository } from '../../../../../src/modules/bitacora/infrastructure/persistence/user-keys.mysql';

const USER = 7;
const RECORD = { kdf: 'PBKDF2-SHA256', iterations: 600000, salt: 'c2FsdHNhbHRzYWx0c2FsdA', wrappedDek: 'v1:abc' };
const sqlOf = (mock: jest.Mock, call: number): string => (mock.mock.calls[call][0] as string).replace(/\s+/g, ' ');

describe('UserKeysMysqlRepository (SPEC v1.11 §4.6)', () => {
  let executeQuery: jest.Mock;
  let repository: UserKeysMysqlRepository;

  beforeEach(() => {
    executeQuery = jest.fn();
    repository = new UserKeysMysqlRepository({ executeQuery } as any);
  });

  it('findKey reads the user row with a numeric iteration count', async () => {
    executeQuery.mockResolvedValue([{ ...RECORD, iterations: '600000' }]);
    expect(await repository.findKey(USER)).toEqual(RECORD);
    expect(sqlOf(executeQuery, 0)).toContain('FROM user_keys WHERE user_id = ?');
    expect(executeQuery.mock.calls[0][1]).toEqual([USER]);
  });

  it('findKey returns null when the user has no key', async () => {
    executeQuery.mockResolvedValue([]);
    expect(await repository.findKey(USER)).toBeNull();
  });

  it('createKey inserts the row and returns true', async () => {
    executeQuery.mockResolvedValue({});
    expect(await repository.createKey(USER, RECORD)).toBe(true);
    expect(sqlOf(executeQuery, 0)).toContain('INSERT INTO user_keys');
    expect(executeQuery.mock.calls[0][1]).toEqual([USER, 'PBKDF2-SHA256', 600000, RECORD.salt, 'v1:abc']);
  });

  it('createKey returns false on a duplicate (the user already has a key)', async () => {
    executeQuery.mockRejectedValue(Object.assign(new Error('dup'), { code: 'ER_DUP_ENTRY' }));
    expect(await repository.createKey(USER, RECORD)).toBe(false);
  });

  it('createKey rethrows any other error', async () => {
    executeQuery.mockRejectedValue(new Error('connection lost'));
    await expect(repository.createKey(USER, RECORD)).rejects.toThrow('connection lost');
  });

  it('replaceKey updates the user row', async () => {
    executeQuery.mockResolvedValue({});
    await repository.replaceKey(USER, RECORD);
    expect(sqlOf(executeQuery, 0)).toContain('UPDATE user_keys SET kdf = ?, kdf_iterations = ?, kdf_salt = ?, wrapped_dek = ?');
    expect(sqlOf(executeQuery, 0)).toContain('WHERE user_id = ?');
    expect(executeQuery.mock.calls[0][1]).toEqual(['PBKDF2-SHA256', 600000, RECORD.salt, 'v1:abc', USER]);
  });
});
