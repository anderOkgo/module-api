import Serie from '../../domain/models/Series';
import Year from '../../domain/models/Year';
export interface ProductionRepository {
  getProductionRepository(production: Serie): Promise<Serie>;
  getProductionYearRepository(): Promise<Year>;
}
