import { UpdateSeriesHandler } from '../../../../../../src/modules/series/application/handlers/commands/update-series.handler';
import { UpdateSeriesCommand } from '../../../../../../src/modules/series/application/commands/update-series.command';
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

const existingSeries = { id: 1, name: 'Existing', visible: true } as any;
const updatedSeries = { id: 1, name: 'Updated', visible: true } as any;

describe('UpdateSeriesHandler', () => {
  let handler: UpdateSeriesHandler;

  beforeEach(() => {
    handler = new UpdateSeriesHandler(mockWrite, mockRead);
    jest.clearAllMocks();
    mockRead.findById.mockResolvedValue(existingSeries);
    mockWrite.update.mockResolvedValue();
    mockWrite.updateRank.mockResolvedValue();
    mockRead.getDemographics.mockResolvedValue([{ id: 1, name: 'Shounen' }] as any);
  });

  it('updates a series with normalized (trimmed) fields and returns the refreshed series', async () => {
    mockRead.findById.mockResolvedValueOnce(existingSeries).mockResolvedValueOnce(updatedSeries);

    const result = await handler.execute(new UpdateSeriesCommand(1, '  Updated  ', 5, 2024, ' d ', ' de ', 7, 1, false));

    expect(mockWrite.update).toHaveBeenCalledWith(1, {
      name: 'Updated',
      chapter_number: 5,
      year: 2024,
      description: 'd',
      description_en: 'de',
      qualification: 7,
      demography_id: 1,
      visible: false,
    });
    expect(mockWrite.updateRank).toHaveBeenCalled();
    expect(result).toBe(updatedSeries);
  });

  it('only sends the fields that were actually provided', async () => {
    mockRead.findById.mockResolvedValueOnce(existingSeries).mockResolvedValueOnce(updatedSeries);

    await handler.execute(new UpdateSeriesCommand(1, 'Only Name'));

    expect(mockWrite.update).toHaveBeenCalledWith(1, { name: 'Only Name' });
  });

  it('skips the demography existence check when demography_id is not provided', async () => {
    mockRead.findById.mockResolvedValueOnce(existingSeries).mockResolvedValueOnce(updatedSeries);

    await handler.execute(new UpdateSeriesCommand(1, 'Name Only'));

    expect(mockRead.getDemographics).not.toHaveBeenCalled();
  });

  it('throws for an invalid series id', async () => {
    await expect(handler.execute(new UpdateSeriesCommand(0, 'Name'))).rejects.toThrow(
      'Valid series ID is required'
    );
  });

  it('throws when name is too short or too long', async () => {
    await expect(handler.execute(new UpdateSeriesCommand(1, 'A'))).rejects.toThrow(
      'Series name must be at least 2 characters'
    );
    await expect(handler.execute(new UpdateSeriesCommand(1, 'A'.repeat(201)))).rejects.toThrow(
      'Series name must not exceed 200 characters'
    );
  });

  it('throws for a negative chapter_number', async () => {
    await expect(handler.execute(new UpdateSeriesCommand(1, undefined, -1))).rejects.toThrow(
      'Chapter number must be positive'
    );
  });

  it('throws for an out-of-range year', async () => {
    await expect(handler.execute(new UpdateSeriesCommand(1, undefined, undefined, 1899))).rejects.toThrow(
      /Year must be between 1900 and/
    );
    const futureYear = new Date().getFullYear() + 6;
    await expect(
      handler.execute(new UpdateSeriesCommand(1, undefined, undefined, futureYear))
    ).rejects.toThrow(/Year must be between 1900 and/);
  });

  it('throws for an out-of-range qualification', async () => {
    await expect(
      handler.execute(new UpdateSeriesCommand(1, undefined, undefined, undefined, undefined, undefined, -1))
    ).rejects.toThrow('Qualification must be between 0 and 10');
    await expect(
      handler.execute(new UpdateSeriesCommand(1, undefined, undefined, undefined, undefined, undefined, 11))
    ).rejects.toThrow('Qualification must be between 0 and 10');
  });

  it('throws for a non-positive demography_id', async () => {
    await expect(
      handler.execute(
        new UpdateSeriesCommand(1, undefined, undefined, undefined, undefined, undefined, undefined, 0)
      )
    ).rejects.toThrow('Valid demography_id is required');
  });

  it('throws when description or description_en exceed 5000 characters', async () => {
    await expect(
      handler.execute(new UpdateSeriesCommand(1, undefined, undefined, undefined, 'A'.repeat(5001)))
    ).rejects.toThrow('Description must not exceed 5000 characters');
    await expect(
      handler.execute(
        new UpdateSeriesCommand(1, undefined, undefined, undefined, undefined, 'A'.repeat(5001))
      )
    ).rejects.toThrow('Description_en must not exceed 5000 characters');
  });

  it('throws when no fields are provided to update', async () => {
    await expect(handler.execute(new UpdateSeriesCommand(1))).rejects.toThrow('No fields to update');
  });

  it('treats visible as a valid lone update field', async () => {
    mockRead.findById.mockResolvedValueOnce(existingSeries).mockResolvedValueOnce(updatedSeries);

    await handler.execute(
      new UpdateSeriesCommand(1, undefined, undefined, undefined, undefined, undefined, undefined, undefined, false)
    );

    expect(mockWrite.update).toHaveBeenCalledWith(1, { visible: false });
  });

  it('throws when the series does not exist', async () => {
    mockRead.findById.mockResolvedValue(null);

    await expect(handler.execute(new UpdateSeriesCommand(999, 'Name'))).rejects.toThrow('Series not found');
    expect(mockWrite.update).not.toHaveBeenCalled();
  });

  it('throws when demography_id does not exist in the database', async () => {
    await expect(
      handler.execute(
        new UpdateSeriesCommand(1, undefined, undefined, undefined, undefined, undefined, undefined, 999)
      )
    ).rejects.toThrow('Demography ID 999 does not exist');
    expect(mockWrite.update).not.toHaveBeenCalled();
  });

  it('throws when the series cannot be retrieved after the update', async () => {
    mockRead.findById.mockResolvedValueOnce(existingSeries).mockResolvedValueOnce(null);

    await expect(handler.execute(new UpdateSeriesCommand(1, 'Name'))).rejects.toThrow(
      'Series not found after update'
    );
  });
});
