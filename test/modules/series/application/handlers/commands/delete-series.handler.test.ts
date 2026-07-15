import { DeleteSeriesHandler } from '../../../../../../src/modules/series/application/handlers/commands/delete-series.handler';
import { DeleteSeriesCommand } from '../../../../../../src/modules/series/application/commands/delete-series.command';
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

describe('DeleteSeriesHandler', () => {
  let handler: DeleteSeriesHandler;

  beforeEach(() => {
    handler = new DeleteSeriesHandler(mockWrite, mockRead);
    jest.clearAllMocks();
  });

  it('soft-deletes a visible series', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, visible: true } as any);
    mockWrite.delete.mockResolvedValue(true);

    const result = await handler.execute(new DeleteSeriesCommand(1));

    expect(mockWrite.delete).toHaveBeenCalledWith(1);
    expect(result).toEqual({ success: true, message: 'Series deleted successfully' });
  });

  it('throws for an invalid series id', async () => {
    await expect(handler.execute(new DeleteSeriesCommand(0))).rejects.toThrow('Valid series ID is required');
  });

  it('returns not-found when the series does not exist', async () => {
    mockRead.findById.mockResolvedValue(null);

    const result = await handler.execute(new DeleteSeriesCommand(999));

    expect(result).toEqual({ success: false, message: 'Series not found' });
    expect(mockWrite.delete).not.toHaveBeenCalled();
  });

  it('is idempotent when the series is already hidden', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, visible: false } as any);

    const result = await handler.execute(new DeleteSeriesCommand(1));

    expect(result).toEqual({ success: true, message: 'Series deleted successfully' });
    expect(mockWrite.delete).not.toHaveBeenCalled();
  });

  it('returns failure when the repository delete call reports no effect', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, visible: true } as any);
    mockWrite.delete.mockResolvedValue(false);

    const result = await handler.execute(new DeleteSeriesCommand(1));

    expect(result).toEqual({ success: false, message: 'Failed to delete series' });
  });
});
