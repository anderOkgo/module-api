import { GetProductionYearsHandler } from '../../../../../../src/modules/series/application/handlers/queries/get-production-years.handler';
import { GetProductionYearsQuery } from '../../../../../../src/modules/series/application/queries/get-production-years.query';
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

describe('GetProductionYearsHandler', () => {
  let handler: GetProductionYearsHandler;

  beforeEach(() => {
    handler = new GetProductionYearsHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('returns the available years with a total count', async () => {
    mockReadRepository.getProductionYears.mockResolvedValue([{ year: 2023 }] as any);

    const result = await handler.execute(new GetProductionYearsQuery());

    expect(result).toEqual({ years: [{ year: 2023 }], total: 1 });
  });

  it('returns an empty list when there are no years', async () => {
    mockReadRepository.getProductionYears.mockResolvedValue([]);

    const result = await handler.execute(new GetProductionYearsQuery());

    expect(result).toEqual({ years: [], total: 0 });
  });
});
