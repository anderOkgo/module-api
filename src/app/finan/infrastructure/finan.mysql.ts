import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

interface DataParams {
  currency: string;
  date?: string;
  username?: string;
}
export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;
  private Limit: number;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
    this.Limit = 10000;
  }

  public async getInitialLoadRepository(data: DataParams) {
    const movements = await this.movementRepository(data);
    const balance = await this.balanceRepository(data);
    const movementTag = await this.movementTagRepository(data);
    const totalDay = await this.totalDayRepository(data);
    const generalInfo = await this.generalInfoRepository();
    const tripInfo = await this.tripInfoRepository();
    const balanceUntilDate = await this.balanceUntilDateRepository(data);
    const totalBank = await this.totalBankRepository(data);

    return {
      movements,
      balance,
      movementTag,
      totalDay,
      generalInfo,
      tripInfo,
      balanceUntilDate,
      totalBank,
    };
  }

  public async totalBankRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_total_bank WHERE 1
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
  }

  public async totalDayRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_total_day WHERE 1
          ${HDB.generateEqualCondition('DATE(Date_movement)')}
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.date, data.currency, data.username, this.Limit]);
  }

  public async balanceRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_monthly_bills_incomes_no_exchange_order_row WHERE 1
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
  }

  public async movementRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_movements WHERE 1
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
  }

  public async movementSourcesRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_monthly_movements_order_by_source WHERE 1
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
  }

  public async movementTagRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_monthly_movements_order_by_tag WHERE 1
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
  }

  public async generalInfoRepository() {
    const full_query = `SELECT * FROM view_general_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async balanceUntilDateRepository(data: DataParams) {
    const full_query = `SELECT * FROM view_balance_until_date WHERE 1
          ${HDB.generateEqualCondition('currency')}
          ${HDB.generateEqualCondition('user')}
          ${HDB.generateOrderBy('Date_movement', 'DESC')}
          ${HDB.generateLimit()}`;
    return await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
  }

  public async tripInfoRepository() {
    const full_query = `SELECT * FROM view_final_trip_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async putMovementRepository(parameters: any) {
    const { movement_name, movement_val, movement_date, movement_type, movement_tag, currency, username } =
      parameters;
    const full_query = `CALL proc_insert_movement(?, ?, ?, ?, ?, ?, ?)`;
    return await this.Database.executeSafeQuery(full_query, [
      movement_name,
      movement_val,
      movement_date,
      movement_type,
      movement_tag,
      currency,
      username,
    ]);
  }

  public async updateMovementByIdRepository(id: number, parameters: any) {
    const { movement_name, movement_val, movement_date, movement_type, movement_tag, currency, username } =
      parameters;
    const full_query = `CALL proc_update_movement(?, ?, ?, ?, ?, ?, ?, ?)`;
    return await this.Database.executeSafeQuery(full_query, [
      id,
      movement_name,
      movement_val,
      movement_date,
      movement_type,
      movement_tag,
      currency,
      username,
    ]);
  }

  public async deleteMovementByIdRepository(id: number) {
    const full_query = `CALL proc_delete_movement(?)`;
    return await this.Database.executeSafeQuery(full_query, [id]);
  }
}
