import { getProduction as x, getProductionYears as y } from './production.service';
import { ProductionMysqlRepository } from '../../infrastructure/production.mysql';
const productionRepo = new ProductionMysqlRepository();
let getProduction = x(productionRepo);
let getProductionYears = y(productionRepo);
export { getProduction, getProductionYears };
