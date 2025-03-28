import Serie from '../../domain/models/Series';
import Year from '../../domain/models/Year';
export interface ProductionRepository {
  getProduction(production: Serie): Promise<Serie | any>;
  getProductionYears(): Promise<Year | any>;
}
