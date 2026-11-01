import { BitacoraMysqlRepository } from '../../../../../src/modules/bitacora/infrastructure/persistence/bitacora.mysql';
import { Database } from '../../../../../src/infrastructure/my.database.helper';

jest.mock('../../../../../src/infrastructure/my.database.helper');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

const USER = 7;
const row = (date: string, version: number | string = 1, body = `Text of ${date}`) => ({
  date,
  body,
  version,
  modified: '2026-10-31T10:00:00Z',
});
const entry = (date: string, version = 1, body = `Text of ${date}`) => ({
  date,
  body,
  version,
  modified: '2026-10-31T10:00:00Z',
});
const sqlOf = (mock: jest.Mock, call: number): string => (mock.mock.calls[call][0] as string).replace(/\s+/g, ' ');

describe('BitacoraMysqlRepository', () => {
  let repository: BitacoraMysqlRepository;
  let executeQuery: jest.Mock;
  let query: jest.Mock;

  beforeEach(() => {
    executeQuery = jest.fn();
    query = jest.fn();
    MockedDatabase.mockImplementation(
      () =>
        ({
          executeQuery,
          runInTransaction: jest.fn((work: (q: jest.Mock) => Promise<unknown>) => work(query)),
        }) as any
    );
    repository = new BitacoraMysqlRepository();
  });

  it('connects to the MYDATABASEBITACORA database', () => {
    expect(MockedDatabase).toHaveBeenCalledWith('MYDATABASEBITACORA');
  });

  describe('findEntry', () => {
    it('returns the entry, scoped by user and date, with a numeric version', async () => {
      executeQuery.mockResolvedValue([row('2026-03-04', '3')]);
      expect(await repository.findEntry(USER, '2026-03-04')).toEqual(entry('2026-03-04', 3));
      expect(sqlOf(executeQuery, 0)).toContain('WHERE user_id = ? AND entry_date = ?');
      expect(executeQuery.mock.calls[0][1]).toEqual([USER, '2026-03-04']);
    });

    it('returns null when there is none', async () => {
      executeQuery.mockResolvedValue([]);
      expect(await repository.findEntry(USER, '2026-03-04')).toBeNull();
    });
  });

  it('hasEntry tells whether the date has an entry', async () => {
    executeQuery.mockResolvedValueOnce([{ 1: 1 }]).mockResolvedValueOnce([]);
    expect(await repository.hasEntry(USER, '2026-03-03')).toBe(true);
    expect(await repository.hasEntry(USER, '2026-03-03')).toBe(false);
    expect(executeQuery.mock.calls[0][1]).toEqual([USER, '2026-03-03']);
  });

  it('findByMonthDays builds one tuple per pair, newest first', async () => {
    executeQuery.mockResolvedValue([row('2021-03-04')]);
    const result = await repository.findByMonthDays(USER, [
      { month: 2, day: 28 },
      { month: 2, day: 29 },
    ]);
    expect(result).toEqual([entry('2021-03-04')]);
    expect(sqlOf(executeQuery, 0)).toContain('(MONTH(entry_date), DAY(entry_date)) IN ((?, ?), (?, ?))');
    expect(sqlOf(executeQuery, 0)).toContain('ORDER BY entry_date DESC');
    expect(executeQuery.mock.calls[0][1]).toEqual([USER, 2, 28, 2, 29]);
  });

  it('listDates returns the dates of the range, ascending', async () => {
    executeQuery.mockResolvedValue([{ date: '2026-02-01' }, { date: '2026-02-14' }]);
    expect(await repository.listDates(USER, '2026-02-01', '2026-02-28')).toEqual(['2026-02-01', '2026-02-14']);
    expect(sqlOf(executeQuery, 0)).toContain('entry_date BETWEEN ? AND ? ORDER BY entry_date');
    expect(sqlOf(executeQuery, 0)).not.toContain('body');
  });

  describe('saveEntry', () => {
    it('creates version 1 when the date has no entry', async () => {
      query.mockResolvedValueOnce([]).mockResolvedValueOnce({ insertId: 1 }).mockResolvedValueOnce([row('2026-03-04')]);
      expect(await repository.saveEntry(USER, '2026-03-04', 'Hello', null)).toEqual({
        kind: 'created',
        entry: entry('2026-03-04'),
      });
      expect(sqlOf(query, 0)).toContain('FOR UPDATE');
      expect(sqlOf(query, 1)).toContain("VALUES (?, ?, ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())");
      expect(query.mock.calls[1][1]).toEqual([USER, '2026-03-04', 'Hello']);
    });

    it('replaces and increments the version when baseVersion matches', async () => {
      query.mockResolvedValueOnce([row('2026-03-04', 2)]).mockResolvedValueOnce({}).mockResolvedValueOnce([row('2026-03-04', 3)]);
      expect(await repository.saveEntry(USER, '2026-03-04', 'New', 2)).toEqual({
        kind: 'replaced',
        entry: entry('2026-03-04', 3),
      });
      expect(sqlOf(query, 1)).toContain('SET body = ?, version = version + 1, modified = UTC_TIMESTAMP()');
      expect(query.mock.calls[1][1]).toEqual(['New', USER, '2026-03-04']);
    });

    it.each([[1], [null]])('returns a conflict and writes nothing when baseVersion is %p', async (baseVersion) => {
      query.mockResolvedValueOnce([row('2026-03-04', 2)]);
      expect(await repository.saveEntry(USER, '2026-03-04', 'Stale', baseVersion)).toEqual({
        kind: 'conflict',
        entry: entry('2026-03-04', 2),
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it.each(['ER_DUP_ENTRY', 'ER_LOCK_DEADLOCK'])(
      'turns a concurrent first save (%s) into a conflict with the winner',
      async (code) => {
        query.mockResolvedValueOnce([]).mockRejectedValueOnce(Object.assign(new Error(code), { code }));
        executeQuery.mockResolvedValue([row('2026-03-04')]);
        expect(await repository.saveEntry(USER, '2026-03-04', 'Hello', null)).toEqual({
          kind: 'conflict',
          entry: entry('2026-03-04'),
        });
      }
    );

    it('rethrows a race error when no entry is found afterwards', async () => {
      query.mockRejectedValueOnce(Object.assign(new Error('deadlock'), { code: 'ER_LOCK_DEADLOCK' }));
      executeQuery.mockResolvedValue([]);
      await expect(repository.saveEntry(USER, '2026-03-04', 'Hello', null)).rejects.toThrow('deadlock');
    });

    it('rethrows any other error without reading again', async () => {
      query.mockRejectedValueOnce(new Error('connection lost'));
      await expect(repository.saveEntry(USER, '2026-03-04', 'Hello', null)).rejects.toThrow('connection lost');
      expect(executeQuery).not.toHaveBeenCalled();
    });
  });

  describe('moveToTrash', () => {
    it('purges expired rows, copies the entry to the trash and deletes it', async () => {
      query
        .mockResolvedValueOnce({}) // purge
        .mockResolvedValueOnce([row('2026-03-04')]) // lock
        .mockResolvedValueOnce({ insertId: 9 }) // copy
        .mockResolvedValueOnce({}) // delete
        .mockResolvedValueOnce([{ deletedAt: '2026-10-31T12:00:00Z' }]);

      expect(await repository.moveToTrash(USER, '2026-03-04')).toEqual({ deletedAt: '2026-10-31T12:00:00Z' });
      expect(sqlOf(query, 0)).toContain('DELETE FROM entries_trash WHERE user_id = ? AND deleted_at < UTC_TIMESTAMP() - INTERVAL 30 DAY');
      expect(sqlOf(query, 2)).toContain('INSERT INTO entries_trash');
      expect(sqlOf(query, 3)).toBe('DELETE FROM entries WHERE user_id = ? AND entry_date = ?');
      expect(query.mock.calls[4][1]).toEqual([9, USER]);
    });

    it('returns null when there is no entry', async () => {
      query.mockResolvedValueOnce({}).mockResolvedValueOnce([]);
      expect(await repository.moveToTrash(USER, '2026-03-04')).toBeNull();
      expect(query).toHaveBeenCalledTimes(2);
    });
  });

  it('listTrash purges first, then lists the 30-day window with a 140-char preview, newest first', async () => {
    const rows = [{ date: '2026-03-04', preview: 'Text', deletedAt: '2026-10-31T12:00:00Z' }];
    executeQuery.mockResolvedValueOnce({}).mockResolvedValueOnce(rows);
    expect(await repository.listTrash(USER)).toBe(rows);
    expect(sqlOf(executeQuery, 0)).toContain('DELETE FROM entries_trash');
    expect(sqlOf(executeQuery, 1)).toContain('LEFT(body, 140) AS preview');
    expect(sqlOf(executeQuery, 1)).toContain('deleted_at >= UTC_TIMESTAMP() - INTERVAL 30 DAY');
    expect(sqlOf(executeQuery, 1)).toContain('ORDER BY deleted_at DESC, id DESC');
  });

  describe('restoreFromTrash', () => {
    const trashed = [{ id: 9, body: 'Deleted text' }];

    it('returns notFound when nothing is in the 30-day window', async () => {
      query.mockResolvedValueOnce({}).mockResolvedValueOnce([]);
      expect(await repository.restoreFromTrash(USER, '2026-03-04', 'fail')).toEqual({ kind: 'notFound' });
    });

    it('re-inserts the newest trash row with version + 1 when the date is free', async () => {
      query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(trashed)
        .mockResolvedValueOnce([]) // no current entry
        .mockResolvedValueOnce({}) // insert
        .mockResolvedValueOnce({}) // delete from trash
        .mockResolvedValueOnce([row('2026-03-04', 2, 'Deleted text')]);

      expect(await repository.restoreFromTrash(USER, '2026-03-04', 'fail')).toEqual({
        kind: 'restored',
        entry: entry('2026-03-04', 2, 'Deleted text'),
      });
      expect(sqlOf(query, 1)).toContain('ORDER BY deleted_at DESC, id DESC LIMIT 1 FOR UPDATE');
      expect(sqlOf(query, 3)).toContain('SELECT user_id, entry_date, body, version + 1, created, UTC_TIMESTAMP()');
      expect(sqlOf(query, 4)).toBe('DELETE FROM entries_trash WHERE id = ? AND user_id = ?');
    });

    it('returns a conflict with "fail" when the date has a new entry, writing nothing', async () => {
      query.mockResolvedValueOnce({}).mockResolvedValueOnce(trashed).mockResolvedValueOnce([row('2026-03-04')]);
      expect(await repository.restoreFromTrash(USER, '2026-03-04', 'fail')).toEqual({
        kind: 'conflict',
        entry: entry('2026-03-04'),
      });
      expect(query).toHaveBeenCalledTimes(3);
    });

    it.each([
      ['replace', 'Deleted text'],
      ['keepBoth', 'Current text\n\nDeleted text'],
    ] as const)('with "%s" updates the current entry', async (policy, body) => {
      query
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce(trashed)
        .mockResolvedValueOnce([row('2026-03-04', 1, 'Current text')])
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce([row('2026-03-04', 2, body)]);

      const result = await repository.restoreFromTrash(USER, '2026-03-04', policy);

      expect(result).toEqual({ kind: 'restored', entry: entry('2026-03-04', 2, body) });
      expect(sqlOf(query, 3)).toContain('UPDATE entries SET body = ?, version = version + 1');
      expect(query.mock.calls[3][1]).toEqual([body, USER, '2026-03-04']);
    });
  });

  describe('importEntries', () => {
    const items = [
      { date: '2019-03-04', body: 'A' },
      { date: '2019-03-05', body: 'B' },
    ];

    it('with "skip" inserts only the new dates and reports the rest as skipped', async () => {
      query.mockResolvedValueOnce([{ date: '2019-03-05' }]).mockResolvedValueOnce({});
      expect(await repository.importEntries(USER, items, 'skip')).toEqual({
        created: ['2019-03-04'],
        overwritten: [],
        skipped: ['2019-03-05'],
      });
      expect(sqlOf(query, 0)).toContain('entry_date IN (?) FOR UPDATE');
      expect(query.mock.calls[0][1]).toEqual([USER, ['2019-03-04', '2019-03-05']]);
      expect(sqlOf(query, 1)).not.toContain('ON DUPLICATE KEY');
      expect(query.mock.calls[1][1]).toEqual([USER, '2019-03-04', 'A']);
    });

    it('with "skip" writes nothing when every date exists (L3 re-run)', async () => {
      query.mockResolvedValueOnce([{ date: '2019-03-04' }, { date: '2019-03-05' }]);
      expect(await repository.importEntries(USER, items, 'skip')).toEqual({
        created: [],
        overwritten: [],
        skipped: ['2019-03-04', '2019-03-05'],
      });
      expect(query).toHaveBeenCalledTimes(1);
    });

    it('with "overwrite" upserts every item in one statement', async () => {
      query.mockResolvedValueOnce([{ date: '2019-03-05' }]).mockResolvedValueOnce({});
      expect(await repository.importEntries(USER, items, 'overwrite')).toEqual({
        created: ['2019-03-04'],
        overwritten: ['2019-03-05'],
        skipped: [],
      });
      expect(sqlOf(query, 1)).toContain(
        'ON DUPLICATE KEY UPDATE body = VALUES(body), version = version + 1, modified = UTC_TIMESTAMP()'
      );
      expect(query.mock.calls[1][1]).toEqual([USER, '2019-03-04', 'A', USER, '2019-03-05', 'B']);
    });
  });
});
