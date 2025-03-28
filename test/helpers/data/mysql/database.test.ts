import { Database } from '../../../../src/helpers/my.database.helper';
import { ProductionMysqlRepository } from '../../../../src/app/series/infrastructure/series.mysql';
import Series from '../../../../src/app/series/domain/models/Series';

// Mock the Database class
jest.mock('../../../../src/helpers/my.database.helper');

describe('ProductionMysqlRepository', () => {
  let productionRepository: ProductionMysqlRepository;

  beforeEach(() => {
    productionRepository = new ProductionMysqlRepository();
  });

  it('should get productions with specified conditions', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ productions: [] }]);

    const production: Series = {
      production_name: 'Sample Production',
      production_number_chapters: [10, 20],
      production_description: 'Sample Description',
      production_year: [2000, 2020],
      demographic_name: 'Demographic Name',
      genre_names: ['Genre 1'],
      id: [1, 2, 3],
      limit: '10',
    };

    const result = await productionRepository.getProduction(production);

    expect(result).toEqual([{ productions: [] }]);
  });

  it('should get production years', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeSafeQuery as jest.Mock).mockResolvedValue([{ years: [] }]);

    const result = await productionRepository.getProductionYears();

    expect(result).toEqual([{ years: [] }]);

    // Verify that the expected method is called
    expect(Database.prototype.executeSafeQuery).toHaveBeenCalledWith('SELECT * FROM view_all_years_productions');
  });
});
