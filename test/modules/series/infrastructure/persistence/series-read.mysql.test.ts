import { SeriesReadMysqlRepository } from '../../../../../src/modules/series/infrastructure/persistence/series-read.mysql';
import { Database } from '../../../../../src/infrastructure/my.database.helper';

// Only Database is mocked here — HDB (mysql.helper) is kept real, since getProductions()
// relies on its actual query-building logic, which is exactly what this suite verifies.
jest.mock('../../../../../src/infrastructure/my.database.helper', () => {
  const actual = jest.requireActual('../../../../../src/infrastructure/my.database.helper');
  return {
    Database: jest.fn(),
    HDB: actual.HDB,
  };
});
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('SeriesReadMysqlRepository', () => {
  let repository: SeriesReadMysqlRepository;
  let mockDatabase: jest.Mocked<Database>;

  const rawRow = {
    id: 1,
    name: 'Test Series',
    chapter_numer: 12,
    year: 2023,
    description: 'desc',
    description_en: 'desc en',
    qualification: 8,
    demography_id: 1,
    demographic_name: 'Shounen',
    visible: 1,
    image: '/img/tarjeta/1.jpg',
    rank: 1,
  };

  const mappedResponse = {
    id: 1,
    name: 'Test Series',
    chapter_number: 12,
    year: 2023,
    description: 'desc',
    description_en: 'desc en',
    qualification: 8,
    demography_id: 1,
    demographic_name: 'Shounen',
    visible: true,
    image: '/img/tarjeta/1.jpg',
    rank: 1,
  };

  beforeEach(() => {
    mockDatabase = { executeSafeQuery: jest.fn() } as any;
    MockedDatabase.mockImplementation(() => mockDatabase);
    repository = new SeriesReadMysqlRepository();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('returns the mapped series with genres and titles attached', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([rawRow]) // main query
        .mockResolvedValueOnce([{ id: 1, name: 'Action', slug: 'action' }]) // genres
        .mockResolvedValueOnce([{ id: 10, production_id: 1, name: 'Alt Title' }]); // titles

      const result = await repository.findById(1);

      expect(result).toEqual({
        ...mappedResponse,
        genres: [{ id: 1, name: 'Action', slug: 'action' }],
        titles: [{ id: 10, production_id: 1, name: 'Alt Title' }],
      });
    });

    it('returns null when the main query errors', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce({ errorSys: true });

      expect(await repository.findById(999)).toBeNull();
    });

    it('returns null when no row is found', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([]);

      expect(await repository.findById(999)).toBeNull();
    });

    it('omits genres/titles when those sub-queries error', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([rawRow])
        .mockResolvedValueOnce({ errorSys: true })
        .mockResolvedValueOnce({ errorSys: true });

      const result = await repository.findById(1);

      expect(result!.genres).toBeUndefined();
      expect(result!.titles).toBeUndefined();
    });
  });

  describe('findByNameAndYear', () => {
    it('returns the matching series', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([{ id: 1, name: 'Test Series', year: 2023 }]);

      const result = await repository.findByNameAndYear('Test Series', 2023);

      expect(result).toEqual({ id: 1, name: 'Test Series', year: 2023 });
    });

    it('returns null when there is no match', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      expect(await repository.findByNameAndYear('Unknown', 2023)).toBeNull();
    });

    it('throws on a database error', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'query failed' });

      await expect(repository.findByNameAndYear('X', 2023)).rejects.toThrow('query failed');
    });

    it('excludes soft-deleted (invisible) series from the duplicate check', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      await repository.findByNameAndYear('Test Series', 2023);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('visible = 1'),
        ['Test Series', 2023]
      );
    });
  });

  describe('findAll', () => {
    it('returns mapped series with pagination total', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce([rawRow])
        .mockResolvedValueOnce([{ total: 42 }]);

      const result = await repository.findAll(10, 0);

      expect(result).toEqual({ series: [mappedResponse], total: 42 });
    });

    it('defaults total to 0 when the count query returns nothing', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await repository.findAll(10, 0);

      expect(result.total).toBe(0);
    });

    it('throws when the data query errors', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ errorSys: true, message: 'data query failed' })
        .mockResolvedValueOnce([{ total: 0 }]);

      await expect(repository.findAll(10, 0)).rejects.toThrow('data query failed');
    });
  });

  describe('search', () => {
    it('builds a query with all optional filters applied', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([rawRow]);

      const result = await repository.search({ name: 'Test', year: 2023, demography_id: 1, limit: 20, offset: 5 });

      expect(result).toEqual([mappedResponse]);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringMatching(/AND p\.name LIKE \?.*AND p\.year = \?.*AND p\.demography_id = \?/s),
        ['%Test%', 2023, 1, 20, 5]
      );
    });

    it('applies default limit/offset when none are provided', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      await repository.search({});

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(expect.any(String), [50, 0]);
    });

    it('throws on a database error', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'search failed' });

      await expect(repository.search({})).rejects.toThrow('search failed');
    });
  });

  describe('getGenres', () => {
    it('returns the genre catalog', async () => {
      const genres = [{ id: 1, name: 'Action', slug: 'action' }];
      mockDatabase.executeSafeQuery.mockResolvedValue(genres);

      expect(await repository.getGenres()).toBe(genres);
    });

    it('throws on a database error', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'genres failed' });

      await expect(repository.getGenres()).rejects.toThrow('genres failed');
    });
  });

  describe('getDemographics', () => {
    it('returns the demographic catalog', async () => {
      const demographics = [{ id: 1, name: 'Shounen', slug: 'shounen' }];
      mockDatabase.executeSafeQuery.mockResolvedValue(demographics);

      expect(await repository.getDemographics()).toBe(demographics);
    });

    it('throws on a database error', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'demographics failed' });

      await expect(repository.getDemographics()).rejects.toThrow('demographics failed');
    });
  });

  describe('getProductionYears', () => {
    it('returns the available years', async () => {
      const years = [{ year: 2023 }];
      mockDatabase.executeSafeQuery.mockResolvedValue(years);

      expect(await repository.getProductionYears()).toBe(years);
    });

    it('throws on a database error', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'years failed' });

      await expect(repository.getProductionYears()).rejects.toThrow('years failed');
    });
  });

  describe('getProductions', () => {
    it('applies the default DESC-by-id order and limit when no filters are given', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([rawRow]);

      const result = await repository.getProductions({ limit: 500 });

      expect(result).toEqual([rawRow]);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringMatching(/ORDER BY id DESC.*LIMIT \?/s),
        [500]
      );
    });

    it('applies name/year/description/demographic/genre filters', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      await repository.getProductions({
        production_name: 'Test',
        production_number_chapters: [1, 12],
        production_description: 'desc',
        production_description_en: 'desc en',
        production_year: [2020, 2023],
        demographic_name: 'Shounen',
        genre_names: ['Action', 'Comedy'],
        limit: 50,
      });

      const [query, params] = mockDatabase.executeSafeQuery.mock.calls[0];
      expect(query).toContain('production_name LIKE');
      expect(query).toContain('production_number_chapters BETWEEN');
      expect(query).toContain('demographic_name = ?');
      expect(params).toEqual(
        expect.arrayContaining(['Test', 1, 12, 'desc', 'desc en', 2020, 2023, 'Shounen', 'Action', 'Comedy', 50])
      );
    });

    it('filters and orders by an explicit id list, preserving order via FIELD()', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      await repository.getProductions({ id: [3, 1, 2], limit: 10 });

      const [query, params] = mockDatabase.executeSafeQuery.mock.calls[0];
      expect(query).toContain('v.id IN');
      expect(query).toContain('ORDER BY FIELD(v.id');
      expect(params).toEqual([3, 1, 2, 3, 1, 2, 10]);
    });

    it('honors an explicit sort direction and skips the default id ordering', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      await repository.getProductions({ production_ranking_number: 'ASC', limit: 10 });

      const [query] = mockDatabase.executeSafeQuery.mock.calls[0];
      expect(query).not.toContain('ORDER BY id DESC');
      expect(query).toContain('ORDER BY production_ranking_number ASC');
    });

    it('throws on a database error', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'productions failed' });

      await expect(repository.getProductions({ limit: 10 })).rejects.toThrow('productions failed');
    });

    it('does not push a limit parameter when filters.limit is falsy', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue([]);

      await repository.getProductions({});

      const [, params] = mockDatabase.executeSafeQuery.mock.calls[0];
      expect(params).toEqual([]);
    });
  });
});
