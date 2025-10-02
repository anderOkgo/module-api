/**
 * Entidad de dominio: Movement
 * Representa un movimiento financiero (ingreso o gasto)
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
 * DTO para creación de movimiento
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
 * DTO para actualización de movimiento
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
 * DTO para respuesta de movimiento
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
 * Tipos de movimiento
 */
export enum MovementType {
  INCOME = 1,
  EXPENSE = 2,
  TRANSFER = 8,
}

/**
 * Respuesta de carga inicial
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
  generalInfo?: any[];
  tripInfo?: any[];
}
