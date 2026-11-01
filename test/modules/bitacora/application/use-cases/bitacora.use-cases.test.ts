import { BitacoraRepository } from '../../../../../src/modules/bitacora/application/ports/bitacora.repository';
import { Entry } from '../../../../../src/modules/bitacora/domain/entities/entry.entity';
import { GetHomeUseCase } from '../../../../../src/modules/bitacora/application/use-cases/get-home.use-case';
import { GetNearbyUseCase } from '../../../../../src/modules/bitacora/application/use-cases/get-nearby.use-case';
import { GetEntryUseCase } from '../../../../../src/modules/bitacora/application/use-cases/get-entry.use-case';
import { SaveEntryUseCase } from '../../../../../src/modules/bitacora/application/use-cases/save-entry.use-case';
import { DeleteEntryUseCase } from '../../../../../src/modules/bitacora/application/use-cases/delete-entry.use-case';
import { ListMonthUseCase } from '../../../../../src/modules/bitacora/application/use-cases/list-month.use-case';
import { ListTrashUseCase } from '../../../../../src/modules/bitacora/application/use-cases/list-trash.use-case';
import { RestoreEntryUseCase } from '../../../../../src/modules/bitacora/application/use-cases/restore-entry.use-case';
import { ImportEntriesUseCase } from '../../../../../src/modules/bitacora/application/use-cases/import-entries.use-case';
import { systemClock } from '../../../../../src/modules/bitacora/application/use-cases/use-case-result';

const clock = () => new Date('2026-10-31T12:00:00Z');
const USER = 7;

const entry = (date: string, version = 1): Entry => ({
  date,
  body: `Text of ${date}`,
  modified: '2026-10-31T10:00:00Z',
  version,
});

const makeRepo = (): jest.Mocked<BitacoraRepository> => ({
  findEntry: jest.fn(),
  hasEntry: jest.fn(),
  findByMonthDays: jest.fn(),
  listDates: jest.fn(),
  saveEntry: jest.fn(),
  moveToTrash: jest.fn(),
  listTrash: jest.fn(),
  restoreFromTrash: jest.fn(),
  importEntries: jest.fn(),
});

describe('Bitacora use cases', () => {
  let repo: jest.Mocked<BitacoraRepository>;

  beforeEach(() => {
    repo = makeRepo();
  });

  it('systemClock returns the current time', () => {
    const before = Date.now();
    expect(systemClock().getTime()).toBeGreaterThanOrEqual(before);
  });

  describe('every use case rejects a missing or non-numeric userId with 401 (D1) and touches no data', () => {
    const cases: Array<[string, () => Promise<{ status: number }>]> = [
      ['getHome', () => new GetHomeUseCase(makeRepo(), clock).execute(undefined, '2026-03-04')],
      ['getNearby', () => new GetNearbyUseCase(makeRepo(), clock).execute('7', '2026-03-04')],
      ['getEntry', () => new GetEntryUseCase(makeRepo(), clock).execute(0, '2026-03-04')],
      ['saveEntry', () => new SaveEntryUseCase(makeRepo(), clock).execute(1.5, '2026-03-04', {})],
      ['deleteEntry', () => new DeleteEntryUseCase(makeRepo(), clock).execute(null, '2026-03-04')],
      ['listMonth', () => new ListMonthUseCase(makeRepo()).execute(undefined, '2026-03')],
      ['listTrash', () => new ListTrashUseCase(makeRepo()).execute(-1)],
      ['restoreEntry', () => new RestoreEntryUseCase(makeRepo(), clock).execute(undefined, '2026-03-04', {})],
      ['importEntries', () => new ImportEntriesUseCase(makeRepo(), clock).execute(undefined, {})],
    ];

    it.each(cases)('%s', async (_name, run) => {
      expect((await run()).status).toBe(401);
    });
  });

  describe('every :date use case rejects an invalid date with 400 (A8)', () => {
    const cases: Array<[string, () => Promise<{ status: number; errors?: string[] }>]> = [
      ['getHome', () => new GetHomeUseCase(repo, clock).execute(USER, '2026-02-30')],
      ['getNearby', () => new GetNearbyUseCase(repo, clock).execute(USER, 'abc')],
      ['getEntry', () => new GetEntryUseCase(repo, clock).execute(USER, '1899-12-31')],
      ['deleteEntry', () => new DeleteEntryUseCase(repo, clock).execute(USER, '2026-11-02')],
      ['saveEntry', () => new SaveEntryUseCase(repo, clock).execute(USER, '2026-13-01', { body: 'x', baseVersion: null })],
      ['restoreEntry', () => new RestoreEntryUseCase(repo, clock).execute(USER, '2026-13-01', {})],
    ];

    it.each(cases)('%s', async (_name, run) => {
      const result = await run();
      expect(result.status).toBe(400);
      expect(result.errors?.[0]).toMatch(/^date must be/);
    });
  });

  describe('GetHomeUseCase (C2)', () => {
    it('returns the entry, the previous day and other years newest first with yearsAgo (H1, H2)', async () => {
      repo.findEntry.mockResolvedValue(entry('2026-03-04'));
      repo.hasEntry.mockResolvedValue(true);
      repo.findByMonthDays.mockResolvedValue([entry('2026-03-04'), entry('2021-03-04'), entry('2019-03-04')]);

      const result = await new GetHomeUseCase(repo, clock).execute(USER, '2026-03-04');

      expect(result).toEqual({
        success: true,
        status: 200,
        message: 'Home loaded',
        data: {
          date: '2026-03-04',
          entry: entry('2026-03-04'),
          previousDay: { date: '2026-03-03', written: true },
          onThisDay: [
            { ...entry('2021-03-04'), yearsAgo: 5 },
            { ...entry('2019-03-04'), yearsAgo: 7 },
          ],
        },
      });
      expect(repo.hasEntry).toHaveBeenCalledWith(USER, '2026-03-03');
      expect(repo.findByMonthDays).toHaveBeenCalledWith(USER, [{ month: 3, day: 4 }]);
    });

    it('asks for Feb 29 on Feb 28 of a non-leap year (H3)', async () => {
      repo.findEntry.mockResolvedValue(null);
      repo.hasEntry.mockResolvedValue(false);
      repo.findByMonthDays.mockResolvedValue([entry('2024-02-29')]);

      const result = await new GetHomeUseCase(repo, clock).execute(USER, '2026-02-28');

      expect(repo.findByMonthDays).toHaveBeenCalledWith(USER, [
        { month: 2, day: 28 },
        { month: 2, day: 29 },
      ]);
      expect(result.data?.entry).toBeNull();
      expect(result.data?.previousDay).toEqual({ date: '2026-02-27', written: false });
      expect(result.data?.onThisDay).toEqual([{ ...entry('2024-02-29'), yearsAgo: 2 }]);
    });

    it('uses the system clock by default', async () => {
      repo.findByMonthDays.mockResolvedValue([]);
      expect((await new GetHomeUseCase(repo).execute(USER, '2020-01-01')).status).toBe(200);
    });
  });

  describe('GetNearbyUseCase (C3, H4)', () => {
    it('keeps other years within ±3 days, by year then offset, judging the year by the anchor date', async () => {
      repo.findByMonthDays.mockResolvedValue([
        entry('2025-12-31'), // anchor 2026-01-02: the requested year itself -> excluded
        entry('2025-01-05'), // 1 year ago, +3
        entry('2025-01-01'), // 1 year ago, -1
        entry('2019-12-30'), // anchor 2020-01-02: 6 years ago, -3
      ]);

      const result = await new GetNearbyUseCase(repo, clock).execute(USER, '2026-01-02');

      expect(result.status).toBe(200);
      expect(result.data).toEqual([
        { ...entry('2025-01-01'), yearsAgo: 1, offsetDays: -1 },
        { ...entry('2025-01-05'), yearsAgo: 1, offsetDays: 3 },
        { ...entry('2019-12-30'), yearsAgo: 6, offsetDays: -3 },
      ]);
      expect(repo.findByMonthDays.mock.calls[0][1]).toHaveLength(6);
    });
  });

  describe('GetEntryUseCase (C4)', () => {
    it('returns the entry', async () => {
      repo.findEntry.mockResolvedValue(entry('2026-03-04'));
      const result = await new GetEntryUseCase(repo, clock).execute(USER, '2026-03-04');
      expect(result).toMatchObject({ success: true, status: 200, data: entry('2026-03-04') });
    });

    it('returns 404 when there is none (A9)', async () => {
      repo.findEntry.mockResolvedValue(null);
      expect(await new GetEntryUseCase(repo, clock).execute(USER, '2026-03-04')).toEqual({
        success: false,
        status: 404,
        message: 'Entry not found',
      });
    });
  });

  describe('SaveEntryUseCase (C5)', () => {
    it('creates with 201 and passes the trimmed body (A1)', async () => {
      repo.saveEntry.mockResolvedValue({ kind: 'created', entry: entry('2026-03-04') });
      const result = await new SaveEntryUseCase(repo, clock).execute(USER, '2026-03-04', {
        body: '  Hello  ',
        baseVersion: null,
      });
      expect(result.status).toBe(201);
      expect(repo.saveEntry).toHaveBeenCalledWith(USER, '2026-03-04', 'Hello', null);
    });

    it('replaces with 200 (A2)', async () => {
      repo.saveEntry.mockResolvedValue({ kind: 'replaced', entry: entry('2026-03-04', 2) });
      const result = await new SaveEntryUseCase(repo, clock).execute(USER, '2026-03-04', { body: 'x', baseVersion: 1 });
      expect(result).toMatchObject({ status: 200, data: { version: 2 } });
    });

    it('returns 409 with the stored entry on a version conflict (A3, A4)', async () => {
      repo.saveEntry.mockResolvedValue({ kind: 'conflict', entry: entry('2026-03-04', 5) });
      const result = await new SaveEntryUseCase(repo, clock).execute(USER, '2026-03-04', { body: 'x', baseVersion: 4 });
      expect(result).toEqual({
        success: false,
        status: 409,
        message: 'The entry changed on another device',
        data: entry('2026-03-04', 5),
      });
    });

    it('collects every input error and writes nothing (A5)', async () => {
      const result = await new SaveEntryUseCase(repo, clock).execute(USER, 'abc', { body: '   ' });
      expect(result.status).toBe(400);
      expect(result.errors).toHaveLength(3);
      expect(repo.saveEntry).not.toHaveBeenCalled();
    });

    it('treats a missing request body as invalid', async () => {
      const result = await new SaveEntryUseCase(repo, clock).execute(USER, '2026-03-04', undefined);
      expect(result.errors).toEqual(['body must be a string', 'baseVersion must be a positive integer or null']);
    });

    it('reports only the version error when date and body are valid', async () => {
      const result = await new SaveEntryUseCase(repo, clock).execute(USER, '2026-03-04', { body: 'x', baseVersion: 0 });
      expect(result.errors).toEqual(['baseVersion must be a positive integer or null']);
    });
  });

  describe('DeleteEntryUseCase (C6)', () => {
    it('returns the date and purgeOn = deletion + 30 days (T1)', async () => {
      repo.moveToTrash.mockResolvedValue({ deletedAt: '2026-10-31T12:00:00Z' });
      const result = await new DeleteEntryUseCase(repo, clock).execute(USER, '2026-03-04');
      expect(result).toEqual({
        success: true,
        status: 200,
        message: 'Entry moved to the trash',
        data: { date: '2026-03-04', purgeOn: '2026-11-30T12:00:00Z' },
      });
    });

    it('returns 404 when there is no entry', async () => {
      repo.moveToTrash.mockResolvedValue(null);
      expect((await new DeleteEntryUseCase(repo, clock).execute(USER, '2026-03-04')).status).toBe(404);
    });
  });

  describe('ListMonthUseCase (C7)', () => {
    it('queries the whole month and returns its dates (M1)', async () => {
      repo.listDates.mockResolvedValue(['2026-02-01', '2026-02-14']);
      const result = await new ListMonthUseCase(repo).execute(USER, '2026-02');
      expect(repo.listDates).toHaveBeenCalledWith(USER, '2026-02-01', '2026-02-28');
      expect(result.data).toEqual({ month: '2026-02', dates: ['2026-02-01', '2026-02-14'] });
    });

    it.each(['2026-13', 'abc', undefined])('rejects month=%p with 400 (M2)', async (month) => {
      expect((await new ListMonthUseCase(repo).execute(USER, month)).status).toBe(400);
    });
  });

  describe('ListTrashUseCase (C12)', () => {
    it('adds purgeOn to every row', async () => {
      repo.listTrash.mockResolvedValue([{ date: '2026-03-04', preview: 'Text', deletedAt: '2026-10-01T08:00:00Z' }]);
      const result = await new ListTrashUseCase(repo).execute(USER);
      expect(result.data).toEqual([
        { date: '2026-03-04', preview: 'Text', deletedAt: '2026-10-01T08:00:00Z', purgeOn: '2026-10-31T08:00:00Z' },
      ]);
    });
  });

  describe('RestoreEntryUseCase (C13)', () => {
    it('restores with the default policy "fail" (T2)', async () => {
      repo.restoreFromTrash.mockResolvedValue({ kind: 'restored', entry: entry('2026-03-04', 2) });
      const result = await new RestoreEntryUseCase(repo, clock).execute(USER, '2026-03-04', undefined);
      expect(repo.restoreFromTrash).toHaveBeenCalledWith(USER, '2026-03-04', 'fail');
      expect(result).toMatchObject({ status: 200, data: entry('2026-03-04', 2) });
    });

    it('passes the policy and returns 409 with the current entry (T3)', async () => {
      repo.restoreFromTrash.mockResolvedValue({ kind: 'conflict', entry: entry('2026-03-04') });
      const result = await new RestoreEntryUseCase(repo, clock).execute(USER, '2026-03-04', { onConflict: 'fail' });
      expect(result).toMatchObject({ status: 409, data: entry('2026-03-04') });
    });

    it('returns 404 when not in the trash or expired (T5)', async () => {
      repo.restoreFromTrash.mockResolvedValue({ kind: 'notFound' });
      const result = await new RestoreEntryUseCase(repo, clock).execute(USER, '2026-03-04', { onConflict: 'replace' });
      expect(result.status).toBe(404);
    });

    it('rejects an unknown policy with 400', async () => {
      const result = await new RestoreEntryUseCase(repo, clock).execute(USER, '2026-03-04', { onConflict: 'merge' });
      expect(result).toMatchObject({ status: 400, errors: ['onConflict must be one of: fail, replace, keepBoth'] });
      expect(repo.restoreFromTrash).not.toHaveBeenCalled();
    });
  });

  describe('ImportEntriesUseCase (C11)', () => {
    it('imports a valid batch', async () => {
      const summary = { created: ['2019-03-04'], overwritten: [], skipped: [] };
      repo.importEntries.mockResolvedValue(summary);
      const result = await new ImportEntriesUseCase(repo, clock).execute(USER, {
        entries: [{ date: '2019-03-04', body: 'Text' }],
        onConflict: 'skip',
      });
      expect(repo.importEntries).toHaveBeenCalledWith(USER, [{ date: '2019-03-04', body: 'Text' }], 'skip');
      expect(result).toMatchObject({ status: 200, data: summary });
    });

    it('rejects an invalid batch with 400 and writes nothing (L2)', async () => {
      const result = await new ImportEntriesUseCase(repo, clock).execute(USER, {
        entries: [{ date: '2019-03-04', body: 'Text' }, { date: 'bad', body: 'Text' }],
        onConflict: 'skip',
      });
      expect(result.status).toBe(400);
      expect(repo.importEntries).not.toHaveBeenCalled();
    });
  });
});
