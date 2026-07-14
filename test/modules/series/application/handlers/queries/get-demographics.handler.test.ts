import { GetDemographicsHandler } from '../../../../../../src/modules/series/application/handlers/queries/get-demographics.handler';
import { GetDemographicsQuery } from '../../../../../../src/modules/series/application/queries/get-demographics.query';
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

describe('GetDemographicsHandler', () => {
  let handler: GetDemographicsHandler;

  beforeEach(() => {
    handler = new GetDemographicsHandler(mockReadRepository);
    jest.clearAllMocks();
  });

  it('returns the demographic catalog with a total count', async () => {
    mockReadRepository.getDemographics.mockResolvedValue([{ id: 1, name: 'Shounen' }] as any);

    const result = await handler.execute(new GetDemographicsQuery());

    expect(result).toEqual({ demographics: [{ id: 1, name: 'Shounen' }], total: 1 });
  });

  it('returns an empty catalog when there are no demographics', async () => {
    mockReadRepository.getDemographics.mockResolvedValue([]);

    const result = await handler.execute(new GetDemographicsQuery());

    expect(result).toEqual({ demographics: [], total: 0 });
  });
});
