import { GetGenresHandler } from '../../../../../../src/modules/series/application/handlers/queries/get-genres.handler';
import { GetGenresQuery } from '../../../../../../src/modules/series/application/queries/get-genres.query';
import { SeriesReadRepository } from '../../../../../../src/modules/series/application/ports/series-read.repository';

const mockReadRepository: jest.Mocked<SeriesReadRepository> = {
  findById: jest.fn(),
  findByNameAndYear: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  getProductions: jest.fn(),
  getGenres: jest.fn(),
  getDemographics: jest.fn(),
  getProductionYears: jest.fn(),
};

describe('GetGenresHandler', () => {
  let handler: GetGenresHandler;

  beforeEach(() => {
    handler = new GetGenresHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('returns the genre catalog with a total count', async () => {
    mockReadRepository.getGenres.mockResolvedValue([{ id: 1, name: 'Action' }] as any);

    const result = await handler.execute(new GetGenresQuery());

    expect(result).toEqual({ genres: [{ id: 1, name: 'Action' }], total: 1 });
  });

  it('returns an empty catalog when there are no genres', async () => {
    mockReadRepository.getGenres.mockResolvedValue([]);

    const result = await handler.execute(new GetGenresQuery());

    expect(result).toEqual({ genres: [], total: 0 });
  });
});
