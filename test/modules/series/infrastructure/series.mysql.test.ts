import { ProductionMysqlRepository } from '../../../../src/modules/series/infrastructure/series.mysql';
import { Database } from '../../../../src/infrastructure/my.database.helper';
import Production from '../../../../src/modules/series/domain/models/Series';

// Mock the dependencies
jest.mock('../../../../src/infrastructure/my.database.helper');

describe('ProductionMysqlRepository', () => {
  let productionRepository: ProductionMysqlRepository;

  beforeEach(() => {
    productionRepository = new ProductionMysqlRepository();
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should get production data', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ productions: [] }]);

    const production: Production = {
      id: 'string',
      production_name: 'string',
      production_number_chapters: [1, 2],
      production_description: 'string',
      production_year: [1, 2],
      demographic_name: 'string',
      genre_names: ['1', '2'],
      limit: 'string',
    };

    const result = await productionRepository.getProduction(production);

    expect(result).toEqual([{ productions: [] }]);
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM view_all_productions');
  });

  it('should get production years', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ years: [] }]);

    const result = await productionRepository.getProductionYears();

    expect(result).toEqual([{ years: [] }]);
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM view_all_years_productions');
  });
});
