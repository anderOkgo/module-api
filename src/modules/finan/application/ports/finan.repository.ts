import Movement from '../../domain/entities/movement.entity';

/**
 * The writes of one create, edit or delete, run inside one database transaction (Finanz SPEC v0.10, D9):
 * a balance never changes without its movement.
 */
export interface FinanTransaction {
  create(movement: Movement): Promise<Movement>;
  update(id: number, movement: Partial<Movement>, username: string): Promise<Movement>;
  delete(id: number, username: string): Promise<boolean>;
  /** Adds `delta` to a movement's value (the origin balance of another one); false when it does not exist. */
  adjustValue(id: number, delta: number, username: string): Promise<boolean>;
}

/**
 * Repository port for Movement entity
 * Defines the contract for financial data access
 */
export interface FinanRepository {
  // CRUD
  createTableForUser(username: string): Promise<void>;
  findById(id: number, username: string): Promise<Movement | null>;
  findByNameAndDate(name: string, date: string, username: string): Promise<Movement | null>;
  /** Writes go through here: `work` gets the writes, committed together or rolled back together. */
  runInTransaction<T>(work: (tx: FinanTransaction) => Promise<T>): Promise<T>;

  // Specific query methods
  getTotalExpenseDay(username: string, currency: string, date: string): Promise<any[]>;
  getMovements(username: string, currency: string): Promise<any[]>;
  getMovementsByTag(username: string, currency: string): Promise<any[]>;
  getTotalBalance(username: string, currency: string): Promise<any[]>;
  getYearlyBalance(username: string, currency: string): Promise<any[]>;
  getMonthlyBalance(username: string, currency: string): Promise<any[]>;
  getBalanceUntilDate(username: string, currency: string): Promise<any[]>;
  getMonthlyExpensesUntilCurrentDay(username: string, currency: string): Promise<any[]>;
  getMonthlyBudget(username: string, currency: string): Promise<number>;
  getCurrentMonthExpenses(username: string, currency: string): Promise<number>;

  // Special methods (admin)
  getGeneralInfo(): Promise<any[]>;
  getTripInfo(): Promise<any[]>;
}
