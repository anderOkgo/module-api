import { BitacoraRepository } from '../../../../../src/modules/bitacora/application/ports/bitacora.repository';
import { SearchEntriesUseCase } from '../../../../../src/modules/bitacora/application/use-cases/search-entries.use-case';

const USER = 7;
const CIPHER = { encrypt: jest.fn(), decrypt: jest.fn() };

const makeRepo = (): jest.Mocked<BitacoraRepository> =>
  ({ searchEntries: jest.fn() }) as unknown as jest.Mocked<BitacoraRepository>;

describe('SearchEntriesUseCase (C14, SPEC v1.10)', () => {
  it('rejects a missing userId with 401 and touches no data (D1)', async () => {
    const repo = makeRepo();
    expect((await new SearchEntriesUseCase(repo).execute(undefined, { q: 'melgar' }, CIPHER)).status).toBe(401);
    expect(repo.searchEntries).not.toHaveBeenCalled();
  });

  it('rejects a bad query with 400 and touches no data (Q5)', async () => {
    const repo = makeRepo();
    const result = await new SearchEntriesUseCase(repo).execute(USER, { q: 'a' }, CIPHER);
    expect(result).toMatchObject({ status: 400, errors: ['q must be 2 to 200 characters'] });
    expect(repo.searchEntries).not.toHaveBeenCalled();
  });

  it('asks for 50 rows at the offset and cuts one snippet per day around the first term', async () => {
    const repo = makeRepo();
    repo.searchEntries.mockResolvedValue({
      total: 61,
      rows: [
        { date: '2019-01-14', body: 'Back from Melgar. The beach was full.' },
        { date: '2018-08-02', body: 'A quiet beach near Melgar.' },
      ],
    });

    const result = await new SearchEntriesUseCase(repo).execute(USER, { q: 'melgar beach', offset: 50 }, CIPHER);

    expect(repo.searchEntries).toHaveBeenCalledWith(USER, ['melgar', 'beach'], 50, 50, CIPHER);
    expect(result).toEqual({
      success: true,
      status: 200,
      message: 'Search done',
      data: {
        total: 61,
        offset: 50,
        results: [
          { date: '2019-01-14', snippet: 'Back from Melgar. The beach was full.' },
          { date: '2018-08-02', snippet: 'A quiet beach near Melgar.' },
        ],
      },
    });
  });
});
