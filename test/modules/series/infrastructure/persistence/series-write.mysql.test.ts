import { SeriesWriteMysqlRepository } from '../../../../../src/modules/series/infrastructure/persistence/series-write.mysql';
import { Database } from '../../../../../src/infrastructure/my.database.helper';

jest.mock('../../../../../src/infrastructure/my.database.helper');
const MockedDatabase = Database as jest.MockedClass<typeof Database>;

describe('SeriesWriteMysqlRepository', () => {
  let repository: SeriesWriteMysqlRepository;
  let mockDatabase: jest.Mocked<Database>;

  beforeEach(() => {
    mockDatabase = { executeSafeQuery: jest.fn() } as any;
    MockedDatabase.mockImplementation(() => mockDatabase);
    repository = new SeriesWriteMysqlRepository();
    jest.clearAllMocks();
  });

  describe('create', () => {
    const seriesData = {
      name: 'Test Series',
      chapter_number: 12,
      year: 2023,
      description: 'desc',
      description_en: 'desc en',
      qualification: 8,
      demography_id: 1,
      visible: true,
    };

    it('inserts the series and returns the new id', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ insertId: 10 });

      const result = await repository.create(seriesData);

      expect(result).toEqual({ id: 10 });
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO productions'),
        [
          seriesData.name,
          seriesData.chapter_number,
          seriesData.year,
          seriesData.description,
          seriesData.description_en,
          seriesData.qualification,
          seriesData.demography_id,
          seriesData.visible,
        ]
      );
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'insert failed' });

      await expect(repository.create(seriesData)).rejects.toThrow('insert failed');
    });
  });

  describe('update', () => {
    it('builds SET clauses only for defined fields, mapping chapter_number to chapter_numer', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      await repository.update(5, { name: 'Updated', chapter_number: 10 });

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE productions SET name = ?, chapter_numer = ? WHERE id = ?',
        ['Updated', 10, 5]
      );
    });

    it('skips the id field even if present on the payload', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      await repository.update(5, { id: 5, name: 'Updated' } as any);

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('UPDATE productions SET name = ? WHERE id = ?', [
        'Updated',
        5,
      ]);
    });

    it('throws when there are no fields to update', async () => {
      await expect(repository.update(5, {})).rejects.toThrow('No fields to update');
      expect(mockDatabase.executeSafeQuery).not.toHaveBeenCalled();
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'update failed' });

      await expect(repository.update(5, { name: 'X' })).rejects.toThrow('update failed');
    });
  });

  describe('delete (soft delete)', () => {
    it('sets visible = 0 and returns true when a row was affected', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await repository.delete(5);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'UPDATE productions SET visible = 0 WHERE id = ?',
        [5]
      );
    });

    it('returns false when no row was affected', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 0 });

      expect(await repository.delete(999)).toBe(false);
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'delete failed' });

      await expect(repository.delete(5)).rejects.toThrow('delete failed');
    });
  });

  describe('updateImage', () => {
    it('updates the image path and returns true on success', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await repository.updateImage(5, '/img/tarjeta/5.jpg');

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('UPDATE productions SET image = ? WHERE id = ?', [
        '/img/tarjeta/5.jpg',
        5,
      ]);
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'image update failed' });

      await expect(repository.updateImage(5, '/x.jpg')).rejects.toThrow('image update failed');
    });
  });

  describe('assignGenres', () => {
    it('clears existing assignments and inserts the new ones', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValueOnce({ affectedRows: 2 }).mockResolvedValueOnce({});

      const result = await repository.assignGenres(5, [1, 2]);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenNthCalledWith(
        1,
        'DELETE FROM productions_genres WHERE production_id = ?',
        [5]
      );
      expect(mockDatabase.executeSafeQuery).toHaveBeenNthCalledWith(
        2,
        'INSERT INTO productions_genres (production_id, genre_id) VALUES (5, 1),(5, 2)',
        []
      );
    });

    it('only clears assignments (no insert) when genreIds is empty', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await repository.assignGenres(5, []);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledTimes(1);
    });

    it('throws when the insert reports an errorSys', async () => {
      mockDatabase.executeSafeQuery
        .mockResolvedValueOnce({ affectedRows: 1 })
        .mockResolvedValueOnce({ errorSys: true, message: 'insert failed' });

      await expect(repository.assignGenres(5, [1])).rejects.toThrow('insert failed');
    });
  });

  describe('removeGenres', () => {
    it('deletes the given genre assignments', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 2 });

      const result = await repository.removeGenres(5, [1, 2]);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM productions_genres'),
        [5, 1, 2]
      );
    });

    it('short-circuits to true without querying when genreIds is empty', async () => {
      const result = await repository.removeGenres(5, []);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).not.toHaveBeenCalled();
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'remove failed' });

      await expect(repository.removeGenres(5, [1])).rejects.toThrow('remove failed');
    });
  });

  describe('addTitles', () => {
    it('inserts the given titles', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 2 });

      const result = await repository.addTitles(5, ['Alt 1', 'Alt 2']);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(
        'INSERT INTO titles (production_id, name) VALUES (?, ?),(?, ?)',
        [5, 'Alt 1', 5, 'Alt 2']
      );
    });

    it('short-circuits to true without querying when titles is empty', async () => {
      const result = await repository.addTitles(5, []);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).not.toHaveBeenCalled();
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'insert failed' });

      await expect(repository.addTitles(5, ['Alt'])).rejects.toThrow('insert failed');
    });
  });

  describe('removeTitles', () => {
    it('deletes the given titles', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ affectedRows: 1 });

      const result = await repository.removeTitles(5, [100]);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM titles'), [
        5,
        100,
      ]);
    });

    it('short-circuits to true without querying when titleIds is empty', async () => {
      const result = await repository.removeTitles(5, []);

      expect(result).toBe(true);
      expect(mockDatabase.executeSafeQuery).not.toHaveBeenCalled();
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'remove failed' });

      await expect(repository.removeTitles(5, [100])).rejects.toThrow('remove failed');
    });
  });

  describe('updateRank', () => {
    it('calls the stored procedure', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({});

      await repository.updateRank();

      expect(mockDatabase.executeSafeQuery).toHaveBeenCalledWith('CALL update_rank()', []);
    });

    it('throws when the database reports an errorSys', async () => {
      mockDatabase.executeSafeQuery.mockResolvedValue({ errorSys: true, message: 'rank update failed' });

      await expect(repository.updateRank()).rejects.toThrow('rank update failed');
    });
  });
});
