export interface FinanRepository {
  getInitialLoad(data: any): Promise<any>;
  putMovement(parameters: any): Promise<any>;
  updateMovementById(id: number, parameters: any): Promise<any>;
  deleteMovementById(id: number): Promise<any>;
}
