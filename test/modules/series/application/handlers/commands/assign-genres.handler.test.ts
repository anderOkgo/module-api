import { AssignGenresHandler } from '../../../../../../src/modules/series/application/handlers/commands/assign-genres.handler';
import { AssignGenresCommand } from '../../../../../../src/modules/series/application/commands/assign-genres.command';
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

describe('AssignGenresHandler', () => {
  let handler: AssignGenresHandler;

  beforeEach(() => {
    handler = new AssignGenresHandler(mockWrite, mockRead);
    jest.clearAllMocks();
    mockRead.findById.mockResolvedValue({ id: 1 } as any);
    mockRead.getGenres.mockResolvedValue([{ id: 1, name: 'Action' }, { id: 2, name: 'Comedy' }] as any);
  });

  it('assigns deduplicated genre ids and returns a success message', async () => {
    mockWrite.assignGenres.mockResolvedValue(true);

    const result = await handler.execute(new AssignGenresCommand(1, [1, 2, 1]));

    expect(mockWrite.assignGenres).toHaveBeenCalledWith(1, [1, 2]);
    expect(result).toEqual({ success: true, message: 'Genres assigned successfully to series 1' });
  });

  it('throws for an invalid series id', async () => {
    await expect(handler.execute(new AssignGenresCommand(0, [1]))).rejects.toThrow(
      'Valid series ID is required'
    );
  });

  it('throws when genreIds is empty or not an array', async () => {
    await expect(handler.execute(new AssignGenresCommand(1, []))).rejects.toThrow(
      'At least one genre ID is required'
    );
    await expect(handler.execute(new AssignGenresCommand(1, null as any))).rejects.toThrow(
      'At least one genre ID is required'
    );
  });

  it('throws for non-positive or non-integer genre ids', async () => {
    await expect(handler.execute(new AssignGenresCommand(1, [1, -2]))).rejects.toThrow('Invalid genre IDs: -2');
    await expect(handler.execute(new AssignGenresCommand(1, [1.5]))).rejects.toThrow('Invalid genre IDs: 1.5');
  });

  it('throws when the series does not exist', async () => {
    mockRead.findById.mockResolvedValue(null);

    await expect(handler.execute(new AssignGenresCommand(999, [1]))).rejects.toThrow('Series not found');
    expect(mockWrite.assignGenres).not.toHaveBeenCalled();
  });

  it('throws when a genre id does not exist in the catalog', async () => {
    await expect(handler.execute(new AssignGenresCommand(1, [1, 99]))).rejects.toThrow('Invalid genre IDs: 99');
    expect(mockWrite.assignGenres).not.toHaveBeenCalled();
  });
});
