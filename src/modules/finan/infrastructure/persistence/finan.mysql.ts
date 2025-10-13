import { Database } from '../../../../infrastructure/my.database.helper';
import { FinanRepository } from '../../application/ports/finan.repository';
import { DataParams } from '../models/dataparams';
import { isNumber } from '../../../../infrastructure/validatios.helper';
import Movement from '../../domain/entities/movement.entity';

/**
 * MySQL implementation of the financial repository
 * ONLY contains data access logic
 */
export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;
  private Limit: number;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
    this.Limit = 10000;
  }

  // ==================== CRUD METHODS ====================

  async createTableForUser(username: string): Promise<void> {
    await this.Database.executeSafeQuery(`CALL proc_create_movements_table(?)`, [username.toLowerCase()]);
  }

  async create(movement: Movement): Promise<Movement> {
    const tableName = `movements_${movement.user}`;
    const query = `
      INSERT INTO ${tableName}
      (name, value, date_movement, type_source_id, tag, currency, user, log)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [
      movement.name,
      movement.value,
      movement.date_movement,
      movement.type_source_id,
      movement.tag,
      movement.currency,
      movement.user,
      movement.log || 0,
    ];

    const result = await this.Database.executeSafeQuery(query, values);
    return { ...movement, id: result.insertId };
  }

  async findById(id: number, username: string): Promise<Movement | null> {
    const tableName = `movements_${username}`;
    const query = `SELECT * FROM ${tableName} WHERE id = ?`;
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  async update(id: number, movement: Partial<Movement>, username: string): Promise<Movement> {
    const tableName = `movements_${username}`;
    const query = `
      UPDATE ${tableName}
      SET name = ?, value = ?, date_movement = ?, type_source_id = ?, tag = ?, currency = ?, log = ?
      WHERE id = ?
    `;
    const values = [
      movement.name,
      movement.value,
      movement.date_movement,
      movement.type_source_id,
      movement.tag,
      movement.currency,
      movement.log || 0,
      id,
    ];

    await this.Database.executeSafeQuery(query, values);
    const updated = await this.findById(id, username);
    if (!updated) throw new Error('Movement not found after update');
    return updated;
  }

  async delete(id: number, username: string): Promise<boolean> {
    const tableName = `movements_${username}`;
    const query = `DELETE FROM ${tableName} WHERE id = ?`;
    const result = await this.Database.executeSafeQuery(query, [id]);
    return result.affectedRows > 0;
  }

  // ==================== QUERY METHODS ====================

  async getTotalExpenseDay(username: string, currency: string, date: string): Promise<any[]> {
    const full_query = `CALL proc_view_total_expense_day(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, date, this.Limit]);
    return resp[0];
  }

  async getMovements(username: string, currency: string): Promise<any[]> {
    const full_query = `CALL proc_view_movements(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, this.Limit]);
    return resp[0];
  }

  async getMovementsByTag(username: string, currency: string): Promise<any[]> {
    const full_query = `CALL proc_view_monthly_movements_order_by_tag(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, 'DESC', this.Limit]);
    return resp[0];
  }

  async getTotalBalance(username: string, currency: string): Promise<any[]> {
    const full_query = `CALL proc_view_total_balance(?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency]);
    return resp[0];
  }

  async getYearlyBalance(username: string, currency: string): Promise<any[]> {
    const full_query = `CALL proc_view_yearly_expenses_incomes(?, ?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [
      username,
      currency,
      'year_number',
      'DESC',
      this.Limit,
    ]);
    return resp[0];
  }

  async getMonthlyBalance(username: string, currency: string): Promise<any[]> {
    const full_query = `CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, 'DESC', this.Limit]);
    return resp[0];
  }

  async getBalanceUntilDate(username: string, currency: string): Promise<any[]> {
    try {
      const full_query = `CALL proc_view_balance_until_date(?, ?, ?, ?, ?)`;
      const resp = await this.Database.executeSafeQuery(full_query, [
        username,
        currency,
        'date_movement',
        'DESC',
        this.Limit,
      ]);
      return resp[0];
    } catch (error) {
      console.log('Stored procedure not found, using direct query');
      const tableName = `movements_${username}`;
      const query = `
        SELECT DATE_FORMAT(date_movement, '%Y-%m-%d') as date_movement,
               SUM(value) as total_balance
        FROM ${tableName}
        WHERE currency = ?
        GROUP BY DATE_FORMAT(date_movement, '%Y-%m-%d')
        ORDER BY date_movement DESC
        LIMIT ?
      `;
      return await this.Database.executeSafeQuery(query, [currency, this.Limit]);
    }
  }

  async getMonthlyExpensesUntilCurrentDay(username: string, currency: string): Promise<any[]> {
    try {
      const full_query = `CALL proc_monthly_expenses_until_day(?, ?, ?, ?)`;
      const resp = await this.Database.executeSafeQuery(full_query, [username, currency, 'ASC', this.Limit]);
      return resp[0];
    } catch (error) {
      console.log('Stored procedure not found, using direct query');
      const tableName = `movements_${username}`;
      const query = `
        SELECT DATE_FORMAT(date_movement, '%Y-%m') as month_year,
               SUM(value) as total_expenses
        FROM ${tableName}
        WHERE currency = ? AND date_movement <= CURDATE()
        GROUP BY DATE_FORMAT(date_movement, '%Y-%m')
        ORDER BY month_year ASC
        LIMIT ?
      `;
      return await this.Database.executeSafeQuery(query, [currency, this.Limit]);
    }
  }

  // ==================== SPECIAL METHODS ====================

  async getGeneralInfo(): Promise<any[]> {
    const query = `SELECT * FROM view_general_info`;
    return await this.Database.executeSafeQuery(query);
  }

  async getTripInfo(): Promise<any[]> {
    const query = `SELECT * FROM view_final_trip_info`;
    return await this.Database.executeSafeQuery(query);
  }

  async operateForLinkedMovement(
    id: number,
    value: number,
    movementType: number,
    username: string
  ): Promise<void> {
    const tableName = `movements_${username}`;
    const selectQuery = `SELECT * FROM ${tableName} WHERE id = ?`;
    const prevReg = await this.Database.executeSafeQuery(selectQuery, [id]);

    if (!prevReg || prevReg.length === 0) {
      throw new Error('Linked movement not found');
    }

    let newValue = null;
    if (isNumber(prevReg[0].value)) {
      if (movementType === 1) {
        newValue = prevReg[0].value + value;
      } else if (movementType === 2 || movementType === 8) {
        newValue = prevReg[0].value - value;
      }

      if (newValue !== null) {
        const updateQuery = `UPDATE ${tableName} SET value = ? WHERE id = ?`;
        await this.Database.executeSafeQuery(updateQuery, [newValue, id]);
      }
    }
  }
}
