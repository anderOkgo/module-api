import { Database } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';
import { DataParams } from './models/dataparams';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;
  private Limit: number;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
    this.Limit = 10000;
  }

  public async getInitialLoadRepository(data: DataParams) {
    await this.Database.executeSafeQuery(`CALL proc_create_movements_table(?)`, [data.username]);
    const movements = await this.movementRepository(data);
    const balance = await this.balanceRepository(data);
    const movementTag = await this.movementTagRepository(data);
    const totalDay = await this.totalDayRepository(data);
    let generalInfo: any[] = [];
    let tripInfo: any[] = [];
    if (data.username === 'anderokgo') {
      generalInfo = await this.generalInfoRepository();
      tripInfo = await this.tripInfoRepository();
    }

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
    const full_query = `CALL proc_view_total_bank(?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency]);
    return resp[0];
  }

  public async totalDayRepository(data: DataParams) {
    const { username, currency, date } = data;
    const full_query = `CALL proc_view_total_day(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, date, this.Limit]);
    return resp[0];
  }

  public async balanceRepository(data: DataParams) {
    const full_query = `CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);

    return resp[0];
  }

  public async movementRepository(data: DataParams) {
    const full_query = `CALL proc_view_movements(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);
    return resp[0];
  }

  public async movementSourcesRepository(data: DataParams) {
    const full_query = `CALL proc_view_monthly_movements_order_by_source(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
    return resp[0];
  }

  public async movementTagRepository(data: DataParams) {
    const full_query = `CALL proc_view_monthly_movements_order_by_tag(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);
    return resp[0];
  }

  public async generalInfoRepository() {
    const full_query = `SELECT * FROM view_general_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async balanceUntilDateRepository(data: DataParams) {
    const full_query = `CALL proc_view_balance_until_date(?, ?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [
      data.currency,
      data.username,
      'Date_movement',
      'DESC',
      this.Limit,
    ]);
    return resp[0];
  }

  public async tripInfoRepository() {
    const full_query = `SELECT * FROM view_final_trip_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async putMovementRepository(parameters: any) {
    const full_query = `CALL proc_insert_movement(?, ?, ?, ?, ?, ?, ?)`;
    return await this.Database.executeSafeQuery(full_query, parameters);
  }

  public async updateMovementByIdRepository(id: number, parameters: any) {
    const full_query = `CALL proc_update_movement(?, ?, ?, ?, ?, ?, ?, ?)`;
    return await this.Database.executeSafeQuery(full_query, parameters);
  }

  public async deleteMovementByIdRepository(id: number, username: string) {
    const full_query = `CALL proc_delete_movement(?,?)`;
    return await this.Database.executeSafeQuery(full_query, [id, username]);
  }
}
