export interface FinanRepository {
  getTotalBank(data: any): Promise<any>;
  putMoviment({}): Promise<any>;
}
