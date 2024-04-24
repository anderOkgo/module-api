import { ProductionRepository } from '../../../../../src/app/series/infrastructure/repositories/series.repository';
import {
  getProductionService,
  getProductionYearService,
} from '../../../../../src/app/series/domain/services/series.service';
import Production from '../../../../../src/app/series/domain/models/Series';

// Manually mock ProductionRepository
const mockProductionRepository: ProductionRepository = {
  getProductionRepository: jest.fn(),
  getProductionYearRepository: jest.fn(),
};

describe('Series Services', () => {
  // Reset mock function calls before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call getProductionService when getProductionService is called', () => {
    const productionService = getProductionService(mockProductionRepository);
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

    expect(mockProductionRepository.getProductionRepository).toHaveBeenCalledWith(production);
  });

  it('should call getProductionYearService when getProductionYearsService is called', () => {
    const yearsService = getProductionYearService(mockProductionRepository);

    yearsService();

    expect(mockProductionRepository.getProductionYearRepository).toHaveBeenCalled();
  });
});
