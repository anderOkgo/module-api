import { GetAllSeriesHandler } from '../../../../../../src/modules/series/application/handlers/queries/get-all-series.handler';
import { GetAllSeriesQuery } from '../../../../../../src/modules/series/application/queries/get-all-series.query';
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

describe('GetAllSeriesHandler', () => {
  let handler: GetAllSeriesHandler;

  beforeEach(() => {
    handler = new GetAllSeriesHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('returns series with pagination metadata for valid limit/offset', async () => {
    mockReadRepository.findAll.mockResolvedValue({ series: [{ id: 1 }] as any, total: 1 });

    const result = await handler.execute(new GetAllSeriesQuery(10, 5));

    expect(mockReadRepository.findAll).toHaveBeenCalledWith(10, 5);
    expect(result).toEqual({ series: [{ id: 1 }], pagination: { limit: 10, offset: 5, total: 1 } });
  });

  it('defaults limit to 50 when zero or negative', async () => {
    mockReadRepository.findAll.mockResolvedValue({ series: [], total: 0 });

    await handler.execute(new GetAllSeriesQuery(0, 0));

    expect(mockReadRepository.findAll).toHaveBeenCalledWith(50, 0);
  });

  it('caps limit at 100', async () => {
    mockReadRepository.findAll.mockResolvedValue({ series: [], total: 0 });

    await handler.execute(new GetAllSeriesQuery(500, 0));

    expect(mockReadRepository.findAll).toHaveBeenCalledWith(100, 0);
  });

  it('defaults offset to 0 when negative', async () => {
    mockReadRepository.findAll.mockResolvedValue({ series: [], total: 0 });

    await handler.execute(new GetAllSeriesQuery(50, -10));

    expect(mockReadRepository.findAll).toHaveBeenCalledWith(50, 0);
  });

  it('uses the query class defaults (limit 50, offset 0) when constructed with no arguments', async () => {
    mockReadRepository.findAll.mockResolvedValue({ series: [], total: 0 });

    await handler.execute(new GetAllSeriesQuery());

    expect(mockReadRepository.findAll).toHaveBeenCalledWith(50, 0);
  });
});
