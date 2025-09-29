import { Database } from '../../../../infrastructure/my.database.helper';
import { FinanRepository } from '../../application/ports/finan.repository';
import { DataParams } from '../models/dataparams';
import { isNumber } from '../../../../infrastructure/validatios.helper';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;
  private Limit: number;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
    this.Limit = 10000;
  }

  public async getInitialLoad(data: DataParams) {
    await this.Database.executeSafeQuery(`CALL proc_create_movements_table(?)`, [
      data.username ? data.username.toLowerCase() : '',
    ]);

    const totalExpenseDay = await this.totalExpenseDay(data);
    const movements = await this.movement(data);
    const movementTag = await this.movementTag(data);
    const totalBalance = await this.totalBalance(data);
    const yearlyBalance = await this.yearlyBalance(data);
    const monthlyBalance = await this.monthlyBalance(data);
    const balanceUntilDate = await this.balanceUntilDate(data);
    const monthlyExpensesUntilDay = await this.monthlyExpensesUntilCurrentDay(data);

    let ret: any = {
      totalExpenseDay,
      movements,
      movementTag,
      totalBalance,
      yearlyBalance,
      monthlyBalance,
      balanceUntilDate,
      monthlyExpensesUntilDay,
    };

    if (data.username === 'anderokgo') {
      const generalInfo = await this.generalInfo();
      const tripInfo = await this.tripInfo();
      ret = { ...ret, generalInfo, tripInfo };
    }

    return ret;
  }

  public async totalExpenseDay(data: DataParams) {
    const { username, currency, date } = data;
    const full_query = `CALL proc_view_total_expense_day(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, date, this.Limit]);
    return resp[0];
  }

  public async movement(data: DataParams) {
    const full_query = `CALL proc_view_movements(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);
    return resp[0];
  }

  public async movementTag(data: DataParams) {
    const full_query = `CALL proc_view_monthly_movements_order_by_tag(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [
      data.username,
      data.currency,
      'DESC',
      this.Limit,
    ]);
    return resp[0];
  }

  public async totalBalance(data: DataParams) {
    const full_query = `CALL proc_view_total_balance(?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency]);
    return resp[0];
  }

  public async yearlyBalance(data: DataParams) {
    const full_query = `CALL proc_view_yearly_expenses_incomes(?, ?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [
      data.username,
      data.currency,
      'year_number',
      'DESC',
      this.Limit,
    ]);
    return resp[0];
  }

  public async monthlyBalance(data: DataParams) {
    const full_query = `CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [
      data.username,
      data.currency,
      'DESC',
      this.Limit,
    ]);
    return resp[0];
  }

  public async balanceUntilDate(data: DataParams) {
    try {
      // Intentar usar el stored procedure primero
      const full_query = `CALL proc_view_balance_until_date(?, ?, ?, ?, ?)`;
      const arr = [data.username, data.currency, 'date_movement', 'DESC', this.Limit];
      const resp = await this.Database.executeSafeQuery(full_query, arr);
      return resp[0];
    } catch (error) {
      // Si el stored procedure no existe, usar consulta directa
      console.log('Stored procedure not found, using direct query for balanceUntilDate');
      const table_name = `movements_${data.username}`;
      const direct_query = `
        SELECT 
          DATE_FORMAT(date_movement, '%Y-%m-%d') as date_movement,
          SUM(movement_val) as total_balance
        FROM ${table_name}
        WHERE currency = ?
        GROUP BY DATE_FORMAT(date_movement, '%Y-%m-%d')
        ORDER BY date_movement DESC
        LIMIT ?
      `;
      const resp = await this.Database.executeSafeQuery(direct_query, [data.currency, this.Limit]);
      return resp;
    }
  }

  public async generalInfo() {
    const full_query = `SELECT * FROM view_general_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async tripInfo() {
    const full_query = `SELECT * FROM view_final_trip_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async monthlyExpensesUntilCurrentDay(data: DataParams) {
    try {
      // Intentar usar el stored procedure primero
      const full_query = `CALL proc_monthly_expenses_until_day(?, ?, ?, ?)`;
      const resp = await this.Database.executeSafeQuery(full_query, [
        data.username,
        data.currency,
        'ASC',
        this.Limit,
      ]);
      return resp[0];
    } catch (error) {
      // Si el stored procedure no existe, usar consulta directa
      console.log('Stored procedure not found, using direct query for monthlyExpensesUntilCurrentDay');
      const table_name = `movements_${data.username}`;
      const direct_query = `
        SELECT 
          DATE_FORMAT(date_movement, '%Y-%m') as month_year,
          SUM(movement_val) as total_expenses
        FROM ${table_name}
        WHERE currency = ? 
        AND date_movement <= CURDATE()
        GROUP BY DATE_FORMAT(date_movement, '%Y-%m')
        ORDER BY month_year ASC
        LIMIT ?
      `;
      const resp = await this.Database.executeSafeQuery(direct_query, [data.currency, this.Limit]);
      return resp;
    }
  }

  public async operateFor(parameters: any) {
    const { operate_for, movement_val, username, movement_type } = parameters;
    let full_query = `SELECT * FROM movements_${username} WHERE id = ? `;
    const prev_reg = await this.Database.executeSafeQuery(full_query, operate_for);
    let newVal = null;
    if (isNumber(prev_reg[0].value)) {
      if (movement_type == 1) {
        newVal = prev_reg[0].value + movement_val;
      } else if (movement_type == 2) {
        newVal = prev_reg[0].value - movement_val;
      } else if (movement_type == 8) {
        newVal = prev_reg[0].value - movement_val;
      }

      let full_query = `UPDATE  movements_${username} SET value = ? WHERE id = ? `;
      if (newVal !== null) await this.Database.executeSafeQuery(full_query, [newVal, operate_for]);
    }
  }

  public async putMovement(parameters: any) {
    let { movement_name, movement_val, movement_date, operate_for } = parameters;
    const { movement_type, movement_tag, currency, username } = parameters;

    operate_for = operate_for === undefined || operate_for === '' ? 0 : operate_for;
    if (operate_for) await this.operateFor(parameters);

    const tableName = `movements_${username}`;
    const query = `INSERT INTO ${tableName}
    (name, value, date_movement, type_source_id, tag, currency, user, log)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

    const values = [
      movement_name,
      movement_val,
      movement_date,
      movement_type || null,
      movement_tag || null,
      currency || null,
      username,
      operate_for || null,
    ];

    return await this.Database.executeSafeQuery(query, values);
  }

  public async updateMovementById(id: number, parameters: any) {
    let { movement_name, movement_val, movement_date, operate_for } = parameters;
    const { movement_type, movement_tag, currency, username } = parameters;
    const tableName = `movements_${username}`;

    operate_for = operate_for === undefined || operate_for === '' ? 0 : operate_for;

    const query = `
      UPDATE ${tableName}
      SET
        name = ?,
        value = ?,
        date_movement = ?,
        type_source_id = ?,
        tag = ?,
        currency = ?,
        user = ?,
        log = ?
      WHERE id = ?
    `;

    const values = [
      movement_name,
      movement_val,
      movement_date,
      movement_type || null,
      movement_tag || null,
      currency || null,
      username,
      operate_for || null,
      id,
    ];

    return await this.Database.executeSafeQuery(query, values);
  }

  public async deleteMovementById(id: number, username: string) {
    const tableName = `movements_${username}`;
    const query = `DELETE FROM ${tableName} WHERE id = ?`;
    return await this.Database.executeSafeQuery(query, [id]);
  }
}
