import { ProductionRepository } from '../../../../../src/app/series/infrastructure/repositories/series.repository';
import { getProductions, getProductionYears } from '../../../../../src/app/series/domain/services/series.service';
import Production from '../../../../../src/app/series/domain/models/Series';

// Manually mock ProductionRepository
const mockProductionRepository: ProductionRepository = {
  getProductions: jest.fn(),
  getProductionYears: jest.fn(),
};

describe('Series Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getProductions when getProductionService is called', () => {
    const productionService = getProductions(mockProductionRepository);
    const production: Production = {
      id: 'string',
      production_name: 'string',
      production_number_chapters: 'string',
      production_description: 'string',
      production_year: 'string',
      demographic_name: 'string',
      genre_names: 'string',
      limit: 'string',
    };

    productionService(production);

    expect(mockProductionRepository.getProductions).toHaveBeenCalledWith(production);
  });

  it('should call getProductionYears when getProductionYearsService is called', () => {
    const yearsService = getProductionYears(mockProductionRepository);

    yearsService();

    expect(mockProductionRepository.getProductionYears).toHaveBeenCalled();
  });
});
