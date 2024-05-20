import { ProductionRepository } from '../../infrastructure/repositories/series.repository';
import Production from '../models/Series';

const getProductions = (productionRepo: ProductionRepository) => (production: Production) =>
  productionRepo.getProduction(production);

const getProductionYears = (productionRepo: ProductionRepository) => () => productionRepo.getProductionYears();

export { getProductions, getProductionYears };
