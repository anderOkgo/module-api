import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;
  private Limit: number;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
    this.Limit = 1000;
  }

  public async getInitialLoadRepository(data: any) {
    try {
      const movement = await this.movementRepository(data.currency);
      const balance = await this.balanceRepository(data.currency);
      const movementTag = await this.movementTagRepository(data.currency);
      const movementSources = await this.movementSourcesRepository(data.currency);
      const totalDay = await this.totalDayRepository(data);
      const generalInfo = await this.generalInfoRepository();
      const tripInfo = await this.tripInfoRepository(data.currency);
      const balanceUntilDate = await this.balanceUntilDateRepository(data.currency);

      const full_query = `SELECT * FROM view_total_bank WHERE 1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      const totalBank = await this.Database.executeQuery(full_query, [data.currency, this.Limit]);

      return {
        movement,
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

  public async totalDayRepository(data: any) {
    try {
      const full_query = `SELECT * FROM view_total_day WHERE 1
                          ${HDB.generateEqualCondition('DATE(Date_movement)')}
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [data.date, data.currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async balanceRepository(currency: string) {
    try {
      const full_query = `SELECT * FROM view_monthly_bills_incomes_no_exchange_order_row WHERE 1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementRepository(currency: string) {
    try {
      const full_query = `SELECT * FROM view_movements WHERE 1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementSourcesRepository(currency: string) {
    try {
      const full_query = `SELECT * FROM view_monthly_movements_order_by_source WHERE 1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementTagRepository(currency: string) {
    try {
      const full_query = `SELECT * FROM view_monthly_movements_order_by_tag WHERE 1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async generalInfoRepository() {
    try {
      const full_query = `SELECT * FROM view_general_info`;
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async balanceUntilDateRepository(currency: string) {
    try {
      const full_query = `SELECT * FROM view_balance_until_date WHERE 1
                          ${HDB.generateEqualCondition('currency')}
                          ${HDB.generateOrderBy('Date_movement', 'DESC')}
                          ${HDB.generateLimit()}`;
      return await this.Database.executeQuery(full_query, [currency, this.Limit]);
    } catch (e) {
      console.log(e);
    }
  }

  public async tripInfoRepository(currency: string) {
    try {
      const full_query = `SELECT * FROM view_final_trip_info`;
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async putMovementRepository(parameters: any) {
    try {
      const { name, val, datemov, type, tag, currency } = parameters;
      const full_query = `CALL proc_insert_movement(?, ?, ?, ?, ?, ?)`;
      return await this.Database.executeQuery(full_query, [name, val, datemov, type, tag, currency]);
    } catch (e) {
      console.log(e);
    }
  }

  public async updateMovementByIdRepository(id: number, parameters: any) {
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

  public async deleteMovementByIdRepository(id: number) {
    try {
      const full_query = `DELETE FROM movements WHERE id = ?`;
      return await this.Database.executeQuery(full_query, [id]);
    } catch (e) {
      console.log(e);
    }
  }
}
