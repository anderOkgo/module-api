import { getProductions, getProductionYears } from './production.service';
import { ProductionMysqlRepository } from '../../infrastructure/production.mysql';

const productionRepo = new ProductionMysqlRepository();
const getProductionService = getProductions(productionRepo);
const getProductionYearService = getProductionYears(productionRepo);

export { getProductionService, getProductionYearService };
