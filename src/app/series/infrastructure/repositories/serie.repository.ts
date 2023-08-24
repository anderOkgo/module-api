import Production from '../../domain/models/Series';
import Year from '../../domain/models/Year';
export interface ProductionRepository {
  getProductions(production: Production): Promise<Production>;
  getProductionYears(): Promise<Year>;
}
