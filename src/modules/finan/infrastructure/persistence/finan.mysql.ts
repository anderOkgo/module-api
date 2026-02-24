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

  async findByNameAndDate(name: string, date: string, username: string): Promise<Movement | null> {
    const tableName = `movements_${username}`;
    const query = `SELECT * FROM ${tableName} WHERE name = ? AND date_movement = ? LIMIT 1`;
    const result = await this.Database.executeSafeQuery(query, [name, date]);
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

  /** Savings goal (5 millones) and fixed expense (salud+pensión 855k) */
  private static readonly SAVINGS_GOAL = 5_000_000;
  private static readonly FIXED_HEALTH_PENSION = 855_000;

  /**
   * Monthly budget = (payroll + interest-lulo) - savings_goal - conditional_health_pension.
   * Uses current month if data exists, else previous month for each.
   * Tags: payroll, interest-lulo, aporte-enlinea
   */
  async getMonthlyBudget(username: string, currency: string): Promise<number> {
    // 1. Obtener constantes desde la DB (asumiendo currency_id = 2 para esta lógica)
    const constantsQuery = `
      SELECT name, description
      FROM constants
      WHERE name IN ('SAVINGS_GOAL', 'FIXED_HEALTH_PENSION')
        AND currency_id = 2
    `;
    const constantsRows = await this.Database.executeSafeQuery(constantsQuery, []);

    // Mapear valores con fallbacks por seguridad
    const constantsMap = (constantsRows || []).reduce(
      (acc: Record<string, number>, row: { name: string; description: string }): Record<string, number> => {
        acc[row.name] = parseFloat(row.description) || 0;
        return acc;
      },
      {} as Record<string, number>
    );

    const savingsGoal = constantsMap['SAVINGS_GOAL'] || 0;
    const fixedHealthPension = constantsMap['FIXED_HEALTH_PENSION'] || 0;

    // 2. Consulta de movimientos (tu lógica original)
    const tableName = `movements_${username}`;
    const query = `
      SELECT LOWER(TRIM(tag)) as tag, DATE_FORMAT(date_movement, '%Y-%m') as month_key, SUM(value) as total
      FROM ${tableName}
      WHERE currency = ?
        AND LOWER(TRIM(tag)) IN ('payroll', 'interest-lulo', 'aporte-enlinea')
        AND DATE_FORMAT(date_movement, '%Y-%m') IN (
          DATE_FORMAT(CURDATE(), '%Y-%m'),
          DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL 1 MONTH), '%Y-%m')
        )
      GROUP BY LOWER(TRIM(tag)), DATE_FORMAT(date_movement, '%Y-%m')
    `;

    const rows = await this.Database.executeSafeQuery(query, [currency]);

    // 3. Procesamiento de fechas
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    let payrollCur = 0;
    let payrollPrev = 0;
    let interestCur = 0;
    let interestPrev = 0;
    let aporteCur = 0;

    // 4. Clasificación de resultados
    for (const row of rows || []) {
      const val = parseFloat(row.total ?? '0') || 0;
      const tag = String(row.tag ?? '')
        .toLowerCase()
        .trim();
      const monthKey = String(row.month_key ?? '').trim();

      if (tag === 'payroll') {
        if (monthKey === currentMonth) payrollCur = val;
        else if (monthKey === prevMonthStr) payrollPrev = val;
      } else if (tag === 'interest-lulo') {
        if (monthKey === currentMonth) interestCur = val;
        else if (monthKey === prevMonthStr) interestPrev = val;
      } else if (tag === 'aporte-enlinea') {
        if (monthKey === currentMonth) aporteCur = val;
      }
    }

    // 5. Cálculo del presupuesto usando las constantes de la DB
    const payroll = payrollCur > 0 ? payrollCur : payrollPrev;
    const interest = interestCur > 0 ? interestCur : interestPrev;
    const base = payroll + interest;

    // Si no hay aporte en el mes actual, restamos la pensión fija de la DB
    const healthPensionDiscount = aporteCur <= 0 ? fixedHealthPension : 0;

    const budget = base - savingsGoal - healthPensionDiscount;

    return Number(Math.max(0, budget).toFixed(2));
  }

  /**
   * Sum of all expenses (type_source_id=2) for the current month up to today.
   */
  async getCurrentMonthExpenses(username: string, currency: string): Promise<number> {
    const tableName = `movements_${username}`;
    const query = `
      SELECT COALESCE(SUM(value), 0) as total
      FROM ${tableName}
      WHERE currency = ?
        AND type_source_id = 2
        AND date_movement >= DATE_FORMAT(CURDATE(), '%Y-%m-01')
        AND date_movement < CURDATE() + INTERVAL 1 DAY
    `;
    const result = await this.Database.executeSafeQuery(query, [currency]);
    return Number((parseFloat(result?.[0]?.total ?? '0') || 0).toFixed(2));
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
