import Movement, { CreateMovementRequest, UpdateMovementRequest } from '../../domain/entities/movement.entity';
import { DataParams } from '../../infrastructure/models/dataparams';

/**
 * Puerto de repositorio para entidad Movement
 * Define el contrato para acceso a datos financieros
 */
export interface FinanRepository {
  // Métodos CRUD
  create(movement: Movement): Promise<Movement>;
  findById(id: number, username: string): Promise<Movement | null>;
  update(id: number, movement: Partial<Movement>, username: string): Promise<Movement>;
  delete(id: number, username: string): Promise<boolean>;

  // Métodos de consulta específicos
  getTotalExpenseDay(username: string, currency: string, date: string): Promise<any[]>;
  getMovements(username: string, currency: string): Promise<any[]>;
  getMovementsByTag(username: string, currency: string): Promise<any[]>;
  getTotalBalance(username: string, currency: string): Promise<any[]>;
  getYearlyBalance(username: string, currency: string): Promise<any[]>;
  getMonthlyBalance(username: string, currency: string): Promise<any[]>;
  getBalanceUntilDate(username: string, currency: string): Promise<any[]>;
  getMonthlyExpensesUntilCurrentDay(username: string, currency: string): Promise<any[]>;

  // Métodos especiales (admin)
  getGeneralInfo(): Promise<any[]>;
  getTripInfo(): Promise<any[]>;

  // Operación especial para movimientos vinculados
  operateForLinkedMovement(id: number, value: number, movementType: number, username: string): Promise<void>;
}
