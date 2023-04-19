import Production from './models/Prodution';
export interface ProductionRepository {
  getProductions(production: Production): Production;
  getProductionYears(): any;
}
