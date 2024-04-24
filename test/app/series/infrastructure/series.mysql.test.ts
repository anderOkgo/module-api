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
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

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

    const result = await productionRepository.getProductionRepository(production);
    expect(result).toEqual({});
  });

  it('should get production years', async () => {
    // Mock the behavior of dependencies
    (Database.prototype.executeQuery as jest.Mock).mockResolvedValue({});

    const result = await productionRepository.getProductionYearRepository();

    expect(result).toEqual({});

    // Verify that the expected method is called
    expect(Database.prototype.executeQuery).toHaveBeenCalledWith('SELECT * FROM view_all_years_productions');
  });
});
