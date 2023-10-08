export interface FinanRepository {
  getTotalBank(data: any): Promise<any>;
  putMoviment(parameters: any): Promise<any>;
  updateMovimentById(id: number, parameters: any): Promise<any>;
  deleteMovimentById(id: number): Promise<any>;
}
