import { ProductionRepository } from '../../../../../src/app/series/infrastructure/repositories/series.repository';
import { getProductions, getProductionYears } from '../../../../../src/app/series/domain/services/series.service';
import Production from '../../../../../src/app/series/domain/models/Series';

// Manually mock ProductionRepository
const mockProductionRepository: ProductionRepository = {
  getProduction: jest.fn(),
  getProductionYears: jest.fn(),
};

describe('Series Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getProduction when getProductions is called', () => {
    const productionService = getProductions(mockProductionRepository);
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

    productionService(production);

    expect(mockProductionRepository.getProduction).toHaveBeenCalledWith(production);
  });

  it('should call getProductionYears when getProductionYears is called', () => {
    const yearsService = getProductionYears(mockProductionRepository);

    yearsService();

    expect(mockProductionRepository.getProductionYears).toHaveBeenCalled();
  });
});
