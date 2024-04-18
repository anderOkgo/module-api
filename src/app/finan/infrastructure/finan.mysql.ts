import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;
  private Limit: number;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
    this.Limit = 1000;
  }

  public async getInitialLoad(data: any) {
    try {
      const movements = await this.movements(data.currency);
      const balance = await this.balance(data.currency);
      const movementTag = await this.movementTag(data.currency);
      const movementSources = await this.movementSources(data.currency);
      const totalDay = await this.totalDay(data);
      const generalInfo = await this.generalInfo();
      const tripInfo = await this.tripInfo(data.currency);
      const balanceUntilDate = await this.balanceUntilDate(data.currency);

      const full_query = `SELECT * FROM view_total_bank WHERE 1=1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      const totalBank = await this.Database.executeQuery(full_query, [data.currency, this.Limit]);

      return {
        movements,
        balance,
        movementTag,
        movementSources,
        totalDay,
        generalInfo,
        tripInfo,
        balanceUntilDate,
        totalBank,
      };
    } catch (e) {
      console.log(e);
    }
  }

  public async totalDay(data: any) {
    try {
      const full_query = `SELECT * FROM view_total_day WHERE 1=1
                          ${HDB.generateEqualCondition('DATE(Date_movement)')}
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [data.date, data.currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async balance(currency: string) {
    try {
      const full_query = `SELECT * FROM view_monthly_bills_incomes_no_exchange_order_row WHERE 1=1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async movements(currency: string) {
    try {
      const full_query = `SELECT * FROM view_movements WHERE 1=1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementSources(currency: string) {
    try {
      const full_query = `SELECT * FROM view_monthly_movements_order_by_source WHERE 1=1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementTag(currency: string) {
    try {
      const full_query = `SELECT * FROM view_monthly_movements_order_by_tag WHERE 1=1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async generalInfo() {
    try {
      const full_query = `SELECT * FROM view_general_info`;
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async balanceUntilDate(currency: string) {
    try {
      const full_query = `SELECT * FROM view_balance_until_date WHERE 1=1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateOrderBy('Date_movement', 'DESC')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async tripInfo(currency: string) {
    try {
      const full_query = `SELECT * FROM view_final_trip_info`;
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async putMovement(parameters: any) {
    try {
      const { name, val, datemov, type, tag, currency } = parameters;
      const full_query = `CALL proc_insert_movement(?, ?, ?, ?, ?, ?)`;
      return await this.Database.executeQuery(full_query, [name, val, datemov, type, tag, currency]);
    } catch (e) {
      console.log(e);
    }
  }

  public async updateMovementById(id: number, parameters: any) {
    try {
      const { name, val, datemov, type, tag, currency } = parameters;
      const full_query = `
        UPDATE movements
        SET
          name = ?,
          value = ?,
          date_movement = ?,
          type_source_id = ?,
          tag = ?,
          currency = ?
        WHERE
          id = ?`;
      return await this.Database.executeQuery(full_query, [name, val, datemov, type, tag, currency, id]);
    } catch (e) {
      console.log(e);
    }
  }

  public async deleteMovementById(id: number) {
    try {
      const full_query = `DELETE FROM movements WHERE id = ?`;
      return await this.Database.executeQuery(full_query, [id]);
    } catch (e) {
      console.log(e);
    }
  }
}
