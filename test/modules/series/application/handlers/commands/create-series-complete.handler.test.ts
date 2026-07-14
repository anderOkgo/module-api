import { CreateSeriesCompleteHandler } from '../../../../../../src/modules/series/application/handlers/commands/create-series-complete.handler';
import {
  CreateSeriesCompleteCommand,
  CreateSeriesCompleteRequest,
} from '../../../../../../src/modules/series/application/commands/create-series-complete.command';
import { SeriesWriteRepository } from '../../../../../../src/modules/series/application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../../../../src/modules/series/application/ports/series-read.repository';

const mockWrite: jest.Mocked<SeriesWriteRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateImage: jest.fn(),
  assignGenres: jest.fn(),
  removeGenres: jest.fn(),
  addTitles: jest.fn(),
  removeTitles: jest.fn(),
  updateRank: jest.fn(),
};

const mockRead: jest.Mocked<SeriesReadRepository> = {
  findById: jest.fn(),
  findByNameAndYear: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  getProductions: jest.fn(),
  getGenres: jest.fn(),
  getDemographics: jest.fn(),
  getProductionYears: jest.fn(),
};

const baseData: CreateSeriesCompleteRequest = {
  name: 'Test Series',
  chapter_number: 12,
  year: 2023,
  description: 'desc',
  description_en: 'desc en',
  qualification: 8,
  demography_id: 1,
  visible: true,
};

const finalSeries = { id: 1, name: 'Test Series' } as any;

describe('CreateSeriesCompleteHandler', () => {
  let handler: CreateSeriesCompleteHandler;

  beforeEach(() => {
    handler = new CreateSeriesCompleteHandler(mockWrite, mockRead);
    jest.clearAllMocks();
    mockRead.getDemographics.mockResolvedValue([{ id: 1, name: 'Shounen' }] as any);
    mockRead.getGenres.mockResolvedValue([{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }] as any);
    mockRead.findByNameAndYear.mockResolvedValue(null);
    mockWrite.updateRank.mockResolvedValue();
    mockRead.findById.mockResolvedValue(finalSeries);
  });

  describe('create path (no duplicate)', () => {
    it('creates a series with no genres/titles', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });

      const result = await handler.execute(new CreateSeriesCompleteCommand(baseData));

      expect(mockWrite.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Test Series' }));
      expect(mockWrite.assignGenres).not.toHaveBeenCalled();
      expect(mockWrite.addTitles).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Series created successfully with all relations',
        id: 1,
      });
    });

    it('assigns genres after creating when genres are provided and non-empty', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: [1, 2, 1] }));

      expect(mockWrite.assignGenres).toHaveBeenCalledWith(1, [1, 2]);
    });

    it('does not call assignGenres when genres is an empty array', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: [] }));

      expect(mockWrite.assignGenres).not.toHaveBeenCalled();
    });

    it('adds titles after creating when titles normalize to a non-empty list', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: [' Alt ', 'Alt', ''] }));

      expect(mockWrite.addTitles).toHaveBeenCalledWith(1, ['Alt']);
    });

    it('does not call addTitles when titles normalize to an empty list', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: ['   '] }));

      expect(mockWrite.addTitles).not.toHaveBeenCalled();
    });

    it('defaults description/description_en to empty strings and visible to true when omitted', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });
      const { description, description_en, visible, ...withoutDefaults } = baseData;

      await handler.execute(new CreateSeriesCompleteCommand(withoutDefaults as any));

      expect(mockWrite.create).toHaveBeenCalledWith(
        expect.objectContaining({ description: '', description_en: '', visible: true })
      );
    });

    it('wraps an error when titles is explicitly null (bypasses the array normalization)', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });

      // data.titles=null passes validateInput (falsy skips the isArray check) but normalizeData's
      // `Array.isArray` guard then leaves normalized.titles as null, and the later `.length` access throws.
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: null as any }))
      ).rejects.toThrow('Error creating complete series:');
      expect(mockWrite.addTitles).not.toHaveBeenCalled();
    });
  });

  describe('update path (duplicate name+year exists)', () => {
    beforeEach(() => {
      mockRead.findByNameAndYear.mockResolvedValue({ id: 5, name: 'Test Series', year: 2023 });
    });

    it('updates the existing series and skips relation calls when genres/titles are not provided', async () => {
      mockRead.findById.mockResolvedValue({ id: 5, genres: [], titles: [] } as any);
      mockWrite.update.mockResolvedValue();

      const result = await handler.execute(new CreateSeriesCompleteCommand(baseData));

      expect(mockWrite.update).toHaveBeenCalledWith(5, expect.objectContaining({ id: 5 }));
      expect(mockWrite.create).not.toHaveBeenCalled();
      expect(mockWrite.assignGenres).not.toHaveBeenCalled();
      expect(mockWrite.addTitles).not.toHaveBeenCalled();
      expect(result).toEqual({
        success: true,
        message: 'Series updated successfully with all relations',
        id: 5,
      });
    });

    it('reassigns genres when the new set differs from the existing one', async () => {
      mockRead.findById.mockResolvedValue({ id: 5, genres: [{ id: 1 }], titles: [] } as any);
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: [2] }));

      expect(mockWrite.assignGenres).toHaveBeenCalledWith(5, [2]);
    });

    it('does not touch genres when the new set is the same as the existing one', async () => {
      mockRead.findById.mockResolvedValue({ id: 5, genres: [{ id: 1 }, { id: 2 }], titles: [] } as any);
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: [2, 1] }));

      expect(mockWrite.assignGenres).not.toHaveBeenCalled();
    });

    it('removes old titles and adds new ones when the title set changes', async () => {
      mockRead.findById.mockResolvedValue({
        id: 5,
        genres: [],
        titles: [{ id: 10, name: 'Old Title' }],
      } as any);
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: ['New Title'] }));

      expect(mockWrite.removeTitles).toHaveBeenCalledWith(5, [10]);
      expect(mockWrite.addTitles).toHaveBeenCalledWith(5, ['New Title']);
    });

    it('does not call removeTitles when the series had no existing titles', async () => {
      mockRead.findById.mockResolvedValue({ id: 5, genres: [], titles: [] } as any);
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: ['New Title'] }));

      expect(mockWrite.removeTitles).not.toHaveBeenCalled();
      expect(mockWrite.addTitles).toHaveBeenCalledWith(5, ['New Title']);
    });

    it('clears titles (removes old, adds none) when the new title list is empty', async () => {
      mockRead.findById.mockResolvedValue({
        id: 5,
        genres: [],
        titles: [{ id: 10, name: 'Old Title' }],
      } as any);
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: [] }));

      expect(mockWrite.removeTitles).toHaveBeenCalledWith(5, [10]);
      expect(mockWrite.addTitles).not.toHaveBeenCalled();
    });

    it('does not touch titles when the new set is the same as the existing one (case/whitespace-insensitive)', async () => {
      mockRead.findById.mockResolvedValue({
        id: 5,
        genres: [],
        titles: [{ id: 10, name: 'Same Title' }],
      } as any);
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: [' same title '] }));

      expect(mockWrite.removeTitles).not.toHaveBeenCalled();
      expect(mockWrite.addTitles).not.toHaveBeenCalled();
    });

    it('treats a missing genres/titles array on the existing series as empty', async () => {
      mockRead.findById.mockResolvedValue({ id: 5 } as any); // no genres/titles fields at all
      mockWrite.update.mockResolvedValue();

      await handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: [1], titles: ['New'] }));

      expect(mockWrite.assignGenres).toHaveBeenCalledWith(5, [1]);
      expect(mockWrite.removeTitles).not.toHaveBeenCalled();
      expect(mockWrite.addTitles).toHaveBeenCalledWith(5, ['New']);
    });

    it('throws "Series updated but not found" when re-verification fails on the update path', async () => {
      mockRead.findById
        .mockResolvedValueOnce({ id: 5, genres: [], titles: [] } as any) // existence check inside update branch
        .mockResolvedValueOnce(null); // final re-verification (step 8)
      mockWrite.update.mockResolvedValue();

      await expect(handler.execute(new CreateSeriesCompleteCommand(baseData))).rejects.toThrow(
        'Series updated but not found'
      );
    });

    it('throws when the series cannot be re-fetched right after the update', async () => {
      mockRead.findById.mockResolvedValueOnce(null);
      mockWrite.update.mockResolvedValue();

      await expect(handler.execute(new CreateSeriesCompleteCommand(baseData))).rejects.toThrow(
        'Series not found after update'
      );
    });
  });

  describe('validation errors', () => {
    it('rejects a missing or blank name', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, name: '' }))
      ).rejects.toThrow('Series name is required');
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, name: '   ' }))
      ).rejects.toThrow('Series name is required');
    });

    it('rejects a name outside the 2-200 character range', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, name: 'A' }))
      ).rejects.toThrow('Series name must be between 2 and 200 characters');
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, name: 'A'.repeat(201) }))
      ).rejects.toThrow('Series name must be between 2 and 200 characters');
    });

    it('rejects a negative chapter_number', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, chapter_number: -1 }))
      ).rejects.toThrow('Chapter number must be positive');
    });

    it('rejects an out-of-range year', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, year: 1899 }))
      ).rejects.toThrow(/Year must be between 1900 and/);
    });

    it('rejects an out-of-range qualification', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, qualification: 11 }))
      ).rejects.toThrow('Qualification must be between 0 and 10');
    });

    it('rejects a missing or non-positive demography_id', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, demography_id: 0 }))
      ).rejects.toThrow('Valid demography_id is required');
    });

    it('rejects genres that are not an array', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: 'nope' as any }))
      ).rejects.toThrow('Genres must be an array');
    });

    it('rejects titles that are not an array', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, titles: 'nope' as any }))
      ).rejects.toThrow('Titles must be an array');
    });
  });

  describe('relation validation', () => {
    it('rejects when demography_id does not exist', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, demography_id: 999 }))
      ).rejects.toThrow('Demography ID 999 does not exist');
    });

    it('rejects when a genre id does not exist', async () => {
      await expect(
        handler.execute(new CreateSeriesCompleteCommand({ ...baseData, genres: [999] }))
      ).rejects.toThrow('Invalid genre IDs: 999');
    });
  });

  describe('final verification and error wrapping', () => {
    it('throws when the series cannot be found after creation', async () => {
      mockWrite.create.mockResolvedValue({ id: 1 });
      mockRead.findById.mockResolvedValue(null);

      await expect(handler.execute(new CreateSeriesCompleteCommand(baseData))).rejects.toThrow(
        'Series created but not found'
      );
    });

    it('wraps repository errors with a consistent prefix', async () => {
      mockWrite.create.mockRejectedValue(new Error('DB exploded'));

      await expect(handler.execute(new CreateSeriesCompleteCommand(baseData))).rejects.toThrow(
        'Error creating complete series: DB exploded'
      );
    });

    it('wraps non-Error rejections with a generic message', async () => {
      mockWrite.create.mockRejectedValue('raw string failure');

      await expect(handler.execute(new CreateSeriesCompleteCommand(baseData))).rejects.toThrow(
        'Error creating complete series: Unknown error'
      );
    });
  });
});
