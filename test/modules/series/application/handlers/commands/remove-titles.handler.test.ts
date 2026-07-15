import { RemoveTitlesHandler } from '../../../../../../src/modules/series/application/handlers/commands/remove-titles.handler';
import { RemoveTitlesCommand } from '../../../../../../src/modules/series/application/commands/remove-titles.command';
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
  runInTransaction: jest.fn(),
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

describe('RemoveTitlesHandler', () => {
  let handler: RemoveTitlesHandler;

  beforeEach(() => {
    handler = new RemoveTitlesHandler(mockWrite, mockRead);
    jest.clearAllMocks();
    mockRead.findById.mockResolvedValue({ id: 1 } as any);
  });

  it('removes deduplicated title ids and returns a success message', async () => {
    mockWrite.removeTitles.mockResolvedValue(true);

    const result = await handler.execute(new RemoveTitlesCommand(1, [5, 6, 5]));

    expect(mockWrite.removeTitles).toHaveBeenCalledWith(1, [5, 6]);
    expect(result).toEqual({ success: true, message: 'Titles removed successfully from series 1' });
  });

  it('throws for an invalid series id', async () => {
    await expect(handler.execute(new RemoveTitlesCommand(0, [1]))).rejects.toThrow(
      'Valid series ID is required'
    );
  });

  it('throws when titleIds is empty or not an array', async () => {
    await expect(handler.execute(new RemoveTitlesCommand(1, []))).rejects.toThrow(
      'At least one title ID is required'
    );
    await expect(handler.execute(new RemoveTitlesCommand(1, undefined as any))).rejects.toThrow(
      'At least one title ID is required'
    );
  });

  it('throws for non-positive or non-integer title ids', async () => {
    await expect(handler.execute(new RemoveTitlesCommand(1, [-3]))).rejects.toThrow('Invalid title IDs: -3');
  });

  it('throws when the series does not exist', async () => {
    mockRead.findById.mockResolvedValue(null);

    await expect(handler.execute(new RemoveTitlesCommand(999, [1]))).rejects.toThrow('Series not found');
    expect(mockWrite.removeTitles).not.toHaveBeenCalled();
  });
});
