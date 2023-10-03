import { ProductionRepository } from '../../infrastructure/repositories/series.repository';
import Production from '../models/Series';

export const getProductions = (productionRepository: ProductionRepository) => (production: Production) =>
  productionRepository.getProductions(production);

export const getProductionYears = (productionRepository: ProductionRepository) => () =>
  productionRepository.getProductionYears();
