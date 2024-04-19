import { ProductionRepository } from '../../infrastructure/repositories/series.repository';
import Production from '../models/Series';

export const getProductionService = (productionRepository: ProductionRepository) => (production: Production) =>
  productionRepository.getProductionRepository(production);

export const getProductionYearService = (productionRepository: ProductionRepository) => () =>
  productionRepository.getProductionYearRepository();
