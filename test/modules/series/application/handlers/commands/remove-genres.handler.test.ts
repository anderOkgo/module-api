import { RemoveGenresHandler } from '../../../../../../src/modules/series/application/handlers/commands/remove-genres.handler';
import { RemoveGenresCommand } from '../../../../../../src/modules/series/application/commands/remove-genres.command';
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

describe('RemoveGenresHandler', () => {
  let handler: RemoveGenresHandler;

  beforeEach(() => {
    handler = new RemoveGenresHandler(mockWrite, mockRead);
    jest.clearAllMocks();
    mockRead.findById.mockResolvedValue({ id: 1 } as any);
  });

  it('removes deduplicated genre ids and returns a success message', async () => {
    mockWrite.removeGenres.mockResolvedValue(true);

    const result = await handler.execute(new RemoveGenresCommand(1, [1, 2, 1]));

    expect(mockWrite.removeGenres).toHaveBeenCalledWith(1, [1, 2]);
    expect(result).toEqual({ success: true, message: 'Genres removed successfully from series 1' });
  });

  it('throws for an invalid series id', async () => {
    await expect(handler.execute(new RemoveGenresCommand(-1, [1]))).rejects.toThrow(
      'Valid series ID is required'
    );
  });

  it('throws when genreIds is empty or not an array', async () => {
    await expect(handler.execute(new RemoveGenresCommand(1, []))).rejects.toThrow(
      'At least one genre ID is required'
    );
    await expect(handler.execute(new RemoveGenresCommand(1, 'nope' as any))).rejects.toThrow(
      'At least one genre ID is required'
    );
  });

  it('throws for non-positive or non-integer genre ids', async () => {
    await expect(handler.execute(new RemoveGenresCommand(1, [0]))).rejects.toThrow('Invalid genre IDs: 0');
  });

  it('throws when the series does not exist', async () => {
    mockRead.findById.mockResolvedValue(null);

    await expect(handler.execute(new RemoveGenresCommand(999, [1]))).rejects.toThrow('Series not found');
    expect(mockWrite.removeGenres).not.toHaveBeenCalled();
  });
});
