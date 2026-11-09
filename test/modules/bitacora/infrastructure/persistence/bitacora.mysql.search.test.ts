import { BitacoraMysqlRepository } from '../../../../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql';
import { Database } from '../../../../../src/infrastructure/my.database.helper';

jest.mock('../../../../../src/infrastructure/my.database.helper');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

const USER = 7;
const sqlOf = (mock: jest.Mock, call: number): string => (mock.mock.calls[call][0] as string).replace(/\s+/g, ' ');

describe('BitacoraMysqlRepository.searchEntries (C14, SPEC v1.10 §4.3)', () => {
  let repository: BitacoraMysqlRepository;
  let executeQuery: jest.Mock;

  beforeEach(() => {
    executeQuery = jest.fn();
    MockedDatabase.mockImplementation(() => ({ executeQuery }) as any);
    repository = new BitacoraMysqlRepository();
  });

  it('counts, then reads one page newest first, with one escaped LIKE per term, scoped by user', async () => {
    executeQuery
      .mockResolvedValueOnce([{ total: '61' }])
      .mockResolvedValueOnce([{ date: '2019-01-14', body: 'Text' }]);

    expect(await repository.searchEntries(USER, ['melgar', '100%'], 50, 50)).toEqual({
      total: 61,
      rows: [{ date: '2019-01-14', body: 'Text' }],
    });

    const where = "WHERE user_id = ? AND body LIKE ? ESCAPE '\\\\' AND body LIKE ? ESCAPE '\\\\'";
    expect(sqlOf(executeQuery, 0)).toBe(`SELECT COUNT(*) AS total FROM entries ${where}`);
    expect(executeQuery.mock.calls[0][1]).toEqual([USER, '%melgar%', '%100\\%%']);
    expect(sqlOf(executeQuery, 1)).toBe(
      `SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM entries ${where} ORDER BY entry_date DESC LIMIT ? OFFSET ?`
    );
    expect(executeQuery.mock.calls[1][1]).toEqual([USER, '%melgar%', '%100\\%%', 50, 50]);
  });

  it('skips the page query when nothing matches', async () => {
    executeQuery.mockResolvedValueOnce([{ total: 0 }]);
    expect(await repository.searchEntries(USER, ['melgar'], 50, 0)).toEqual({ total: 0, rows: [] });
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });

  it('skips the page query when the offset is past the last match', async () => {
    executeQuery.mockResolvedValueOnce([{ total: 12 }]);
    expect(await repository.searchEntries(USER, ['melgar'], 50, 50)).toEqual({ total: 12, rows: [] });
    expect(executeQuery).toHaveBeenCalledTimes(1);
  });
});
