import { SearchSeriesHandler } from '../../../../../../src/modules/series/application/handlers/queries/search-series.handler';
import { SearchSeriesQuery } from '../../../../../../src/modules/series/application/queries/search-series.query';
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

describe('SearchSeriesHandler', () => {
  let handler: SearchSeriesHandler;

  beforeEach(() => {
    handler = new SearchSeriesHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('normalizes limit/offset and forwards other filters to the repository', async () => {
    mockReadRepository.search.mockResolvedValue([]);

    await handler.execute(new SearchSeriesQuery({ name: 'Test', limit: 200, offset: 5 } as any));

    expect(mockReadRepository.search).toHaveBeenCalledWith({ name: 'Test', limit: 100, offset: 5 });
  });

  it('defaults limit to 50 and offset to 0 when not provided or invalid', async () => {
    mockReadRepository.search.mockResolvedValue([]);

    await handler.execute(new SearchSeriesQuery({ limit: 0, offset: -5 } as any));

    expect(mockReadRepository.search).toHaveBeenCalledWith({ limit: 50, offset: 0 });
  });

  it('returns whatever the repository resolves', async () => {
    const series = [{ id: 1, name: 'Found' }];
    mockReadRepository.search.mockResolvedValue(series as any);

    const result = await handler.execute(new SearchSeriesQuery({}));

    expect(result).toBe(series);
  });
});
