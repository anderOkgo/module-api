import { ProductionRepository } from '../../infrastructure/repositories/production.repository';
import Production from '../models/Prodution';

const getProductions = (productionRepository: ProductionRepository) => (production: Production) =>
  productionRepository.getProductions(production);
const getProductionYears = (productionRepository: ProductionRepository) => () =>
  productionRepository.getProductionYears();

export { getProductions, getProductionYears };
