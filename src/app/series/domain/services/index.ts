import { getProductionService, getProductionYearService } from './series.service';
import { productionRepository } from '../../infrastructure/index';

const ProductionRepository = new productionRepository();

export const getProduction = getProductionService(ProductionRepository);
export const getProductionYear = getProductionYearService(ProductionRepository);
