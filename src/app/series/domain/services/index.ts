import { getProductions, getProductionYears } from './series.service';
import { productionRepository } from '../../infrastructure/index';

const ProductionRepository = new productionRepository();

export const getProductionService = getProductions(ProductionRepository);
export const getProductionYearService = getProductionYears(ProductionRepository);
