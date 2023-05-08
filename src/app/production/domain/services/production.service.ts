import { ProductionRepository } from '../production.repository';
import Production from '../models/Prodution';
import Year from '../models/Prodution';

const getProduction = (productionRepository: ProductionRepository) => (production: Production) =>
  productionRepository.getProductions(production);

const getProductionYears = (productionRepository: ProductionRepository) => () =>
  productionRepository.getProductionYears();

export { getProductionYears, getProduction };
