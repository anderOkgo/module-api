import { AddTitlesHandler } from '../../../../../../src/modules/series/application/handlers/commands/add-titles.handler';
import { AddTitlesCommand } from '../../../../../../src/modules/series/application/commands/add-titles.command';
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

describe('AddTitlesHandler', () => {
  let handler: AddTitlesHandler;

  beforeEach(() => {
    handler = new AddTitlesHandler(mockWrite, mockRead);
    jest.clearAllMocks();
    mockRead.findById.mockResolvedValue({ id: 1 } as any);
  });

  it('adds normalized, deduplicated, non-empty titles', async () => {
    mockWrite.addTitles.mockResolvedValue(true);

    const result = await handler.execute(new AddTitlesCommand(1, ['  Alt Title  ', 'Alt Title', '']));

    expect(mockWrite.addTitles).toHaveBeenCalledWith(1, ['Alt Title']);
    expect(result).toEqual({ success: true, message: 'Titles added successfully to series 1' });
  });

  it('throws for an invalid series id', async () => {
    await expect(handler.execute(new AddTitlesCommand(0, ['Title']))).rejects.toThrow(
      'Valid series ID is required'
    );
  });

  it('throws when titles is empty or not an array', async () => {
    await expect(handler.execute(new AddTitlesCommand(1, []))).rejects.toThrow('At least one title is required');
    await expect(handler.execute(new AddTitlesCommand(1, null as any))).rejects.toThrow(
      'At least one title is required'
    );
  });

  it('throws when every title is blank after trimming', async () => {
    await expect(handler.execute(new AddTitlesCommand(1, ['   ', '']))).rejects.toThrow(
      'No valid titles provided'
    );
    expect(mockWrite.addTitles).not.toHaveBeenCalled();
  });

  it('throws when the series does not exist', async () => {
    mockRead.findById.mockResolvedValue(null);

    await expect(handler.execute(new AddTitlesCommand(999, ['Title']))).rejects.toThrow('Series not found');
    expect(mockWrite.addTitles).not.toHaveBeenCalled();
  });
});
