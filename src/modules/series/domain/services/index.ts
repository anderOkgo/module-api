import * as service from './series.service';
import { productionRepository } from '../../infrastructure/index';

const productionRepo = new productionRepository();

export const getProductionsService = service.getProductions(productionRepo);
export const getProductionYearsService = service.getProductionYears(productionRepo);
