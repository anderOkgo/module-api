import Movement, { CreateMovementRequest, UpdateMovementRequest } from '../../domain/entities/movement.entity';
import { DataParams } from '../../infrastructure/models/dataparams';

/**
 * Repository port for Movement entity
 * Defines the contract for financial data access
 */
export interface FinanRepository {
  // CRUD
  createTableForUser(username: string): Promise<void>;
  create(movement: Movement): Promise<Movement>;
  findById(id: number, username: string): Promise<Movement | null>;
  findByNameAndDate(name: string, date: string, username: string): Promise<Movement | null>;
  update(id: number, movement: Partial<Movement>, username: string): Promise<Movement>;
  delete(id: number, username: string): Promise<boolean>;

  // Specific query methods
  getTotalExpenseDay(username: string, currency: string, date: string): Promise<any[]>;
  getMovements(username: string, currency: string): Promise<any[]>;
  getMovementsByTag(username: string, currency: string): Promise<any[]>;
  getTotalBalance(username: string, currency: string): Promise<any[]>;
  getYearlyBalance(username: string, currency: string): Promise<any[]>;
  getMonthlyBalance(username: string, currency: string): Promise<any[]>;
  getBalanceUntilDate(username: string, currency: string): Promise<any[]>;
  getMonthlyExpensesUntilCurrentDay(username: string, currency: string): Promise<any[]>;

  // Special methods (admin)
  getGeneralInfo(): Promise<any[]>;
  getTripInfo(): Promise<any[]>;

  // Special operation for linked movements
  operateForLinkedMovement(id: number, value: number, movementType: number, username: string): Promise<void>;
}
