import { getProductions, getProductionYears } from './production.service';
import { ProductionMysqlRepository } from '../../infrastructure/production.mysql';

const productionRepository = new ProductionMysqlRepository();
const getProductionService = getProductions(productionRepository);
const getProductionYearService = getProductionYears(productionRepository);

export { getProductionService, getProductionYearService };
