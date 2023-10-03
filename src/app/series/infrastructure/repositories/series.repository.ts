import Serie from '../../domain/models/Series';
import Year from '../../domain/models/Year';
export interface ProductionRepository {
  getProductions(production: Serie): Promise<Serie>;
  getProductionYears(): Promise<Year>;
}
