/**
 * Domain entity: Movement
 * Represents a financial movement (income or expense)
 */
export default interface Movement {
  id?: number;
  name: string;
  value: number;
  date_movement: string;
  type_source_id: number;
  tag: string;
  currency: string;
  user: string;
  log?: number;
}

/**
 * DTO for movement creation
 */
export interface CreateMovementRequest {
  movement_name: string;
  movement_val: number;
  movement_date: string;
  movement_type: number;
  movement_tag: string;
  currency: string;
  username: string;
  operate_for?: number;
}

/**
 * DTO for movement update
 */
export interface UpdateMovementRequest {
  movement_name: string;
  movement_val: number;
  movement_date: string;
  movement_type: number;
  movement_tag: string;
  currency: string;
  operate_for?: number;
}

/**
 * DTO for movement response
 */
export interface MovementResponse {
  id: number;
  name: string;
  value: number;
  date_movement: string;
  type_source_id: number;
  tag: string;
  currency: string;
  user: string;
}

/**
 * Movement types
 */
export enum MovementType {
  INCOME = 1,
  EXPENSE = 2,
  TRANSFER = 8,
}

/**
 * Initial load response
 */
export interface InitialLoadResponse {
  totalExpenseDay: any[];
  movements: any[];
  movementTag: any[];
  totalBalance: any[];
  yearlyBalance: any[];
  monthlyBalance: any[];
  balanceUntilDate: any[];
  monthlyExpensesUntilDay: any[];
  monthlyBudget?: number;
  currentMonthExpenses?: number;
  remainingBudget?: number;
  generalInfo?: any[];
  tripInfo?: any[];
}
