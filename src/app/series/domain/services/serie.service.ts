import { ProductionRepository } from '../../infrastructure/repositories/serie.repository';
import Production from '../models/Series';

const getProductions = (productionRepository: ProductionRepository) => (production: Production) =>
  productionRepository.getProductions(production);
const getProductionYears = (productionRepository: ProductionRepository) => () =>
  productionRepository.getProductionYears();

export { getProductions, getProductionYears };
