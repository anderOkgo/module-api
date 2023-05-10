import { ProductionRepository } from '../production.repository';
import Production from '../models/Prodution';

const getProduction = (productionRepository: ProductionRepository) => (production: Production) =>
  productionRepository.getProductions(production);

const getProductionYears = (productionRepository: ProductionRepository) => () =>
  productionRepository.getProductionYears();

export { getProduction, getProductionYears };
