import { BitacoraMysqlRepository } from '../../../../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql';
import { BodyCipher } from '../../../../../src/modules/bitacora/application/ports/body-cipher';
import { Database } from '../../../../../src/infrastructure/my.database.helper';

jest.mock('../../../../../src/infrastructure/my.database.helper');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

const USER = 7;
const sqlOf = (mock: jest.Mock, call: number): string => (mock.mock.calls[call][0] as string).replace(/\s+/g, ' ');

/** Readable stand-in for the AES-GCM cipher: the stored body is the text behind its date. */
const sealed = (date: string, plain: string) => `sealed[${date}]${plain}`;
const CIPHER: BodyCipher = {
  encrypt: sealed,
  decrypt: (date, stored) => stored.slice(`sealed[${date}]`.length),
};
const day = (date: string, body: string) => ({ date, body: sealed(date, body) });

describe('BitacoraMysqlRepository.searchEntries (C14, SPEC v1.11 §4.6: matched in the API)', () => {
  let repository: BitacoraMysqlRepository;
  let executeQuery: jest.Mock;

  beforeEach(() => {
    executeQuery = jest.fn();
    MockedDatabase.mockImplementation(() => ({ executeQuery }) as any);
    repository = new BitacoraMysqlRepository();
  });

  it('reads every day of the user newest first in one query, with no text in the SQL', async () => {
    executeQuery.mockResolvedValueOnce([]);
    await repository.searchEntries(USER, ['melgar'], 50, 0, CIPHER);
    expect(executeQuery).toHaveBeenCalledTimes(1);
    expect(sqlOf(executeQuery, 0)).toBe(
      "SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM entries WHERE user_id = ? ORDER BY entry_date DESC"
    );
    expect(executeQuery.mock.calls[0][1]).toEqual([USER]);
  });

  it('keeps the days holding every term, case- and accent-blind, in database order (Q1, Q3)', async () => {
    executeQuery.mockResolvedValueOnce([
      day('2026-03-03', 'Then I left for MELGAR. The beach was empty.'),
      day('2025-07-01', 'Melgar again, no sea.'),
      day('2019-01-14', 'The beach at Melgár was full.'),
      day('2018-08-02', 'Nothing about it.'),
    ]);
    expect(await repository.searchEntries(USER, ['melgar', 'beach'], 50, 0, CIPHER)).toEqual({
      total: 2,
      rows: [
        { date: '2026-03-03', body: 'Then I left for MELGAR. The beach was empty.' },
        { date: '2019-01-14', body: 'The beach at Melgár was full.' },
      ],
    });
  });

  it('matches inside words and takes %, _ and \\ literally (Q4)', async () => {
    executeQuery.mockResolvedValue([
      day('2020-01-04', 'swimming 100% a_b c:\\dir'),
      day('2020-01-03', 'swam 1000 axb c:dir'),
    ]);
    for (const terms of [['swim'], ['100%'], ['a_b'], ['c:\\dir']]) {
      const page = await repository.searchEntries(USER, terms, 50, 0, CIPHER);
      expect(page.rows.map((r) => r.date)).toEqual(['2020-01-04']);
    }
  });

  it('a phrase must appear as typed (Q2)', async () => {
    executeQuery.mockResolvedValueOnce([day('2020-01-02', 'I left for home'), day('2020-01-01', 'for once I left')]);
    const page = await repository.searchEntries(USER, ['left for'], 50, 0, CIPHER);
    expect(page.rows.map((r) => r.date)).toEqual(['2020-01-02']);
  });

  it('returns the total and the page at the offset (Q6)', async () => {
    const days = Array.from({ length: 61 }, (_, i) => day(`2020-03-${String(61 - i).padStart(2, '0')}`, 'melgar'));
    executeQuery.mockResolvedValue(days);
    const first = await repository.searchEntries(USER, ['melgar'], 50, 0, CIPHER);
    const second = await repository.searchEntries(USER, ['melgar'], 50, 50, CIPHER);
    expect([first.total, first.rows.length, second.total, second.rows.length]).toEqual([61, 50, 61, 11]);
    expect(second.rows[0].date).toBe(days[50].date);
  });

  it('returns no rows when nothing matches or the offset is past the last match', async () => {
    executeQuery.mockResolvedValue([day('2020-01-01', 'melgar')]);
    expect(await repository.searchEntries(USER, ['bogota'], 50, 0, CIPHER)).toEqual({ total: 0, rows: [] });
    expect(await repository.searchEntries(USER, ['melgar'], 50, 50, CIPHER)).toEqual({ total: 1, rows: [] });
  });
});
