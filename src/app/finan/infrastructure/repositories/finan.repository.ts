export interface FinanRepository {
  getInitialLoadRepository(data: any): Promise<any>;
  putMovementRepository(parameters: any): Promise<any>;
  updateMovementByIdRepository(id: number, parameters: any): Promise<any>;
  deleteMovementByIdRepository(id: number): Promise<any>;
}
