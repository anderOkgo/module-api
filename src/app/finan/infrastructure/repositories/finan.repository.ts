export interface FinanRepository {
  getTotalBank(): Promise<any>;
  putMoviment({}): Promise<any>;
}
