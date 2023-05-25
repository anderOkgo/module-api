import Production from '../models/Prodution';
import Year from '../models/Year';
export interface ProductionRepository {
  getProductions(production: Production): Promise<Production>;
  getProductionYears(): Promise<Year>;
}
