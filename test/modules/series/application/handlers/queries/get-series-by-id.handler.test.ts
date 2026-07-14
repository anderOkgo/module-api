import { GetSeriesByIdHandler } from '../../../../../../src/modules/series/application/handlers/queries/get-series-by-id.handler';
import { GetSeriesByIdQuery } from '../../../../../../src/modules/series/application/queries/get-series-by-id.query';
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

describe('GetSeriesByIdHandler', () => {
  let handler: GetSeriesByIdHandler;

  beforeEach(() => {
    handler = new GetSeriesByIdHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('returns the series when found', async () => {
    const series = { id: 1, name: 'Test Series' } as any;
    mockReadRepository.findById.mockResolvedValue(series);

    const result = await handler.execute(new GetSeriesByIdQuery(1));

    expect(result).toBe(series);
    expect(mockReadRepository.findById).toHaveBeenCalledWith(1);
  });

  it('returns null when not found', async () => {
    mockReadRepository.findById.mockResolvedValue(null);

    const result = await handler.execute(new GetSeriesByIdQuery(999));

    expect(result).toBeNull();
  });

  it('throws for a zero or negative id', async () => {
    await expect(handler.execute(new GetSeriesByIdQuery(0))).rejects.toThrow('Valid series ID is required');
    await expect(handler.execute(new GetSeriesByIdQuery(-1))).rejects.toThrow('Valid series ID is required');
    expect(mockReadRepository.findById).not.toHaveBeenCalled();
  });
});
