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

  public async getInitialLoad(data: DataParams) {
    this.Database.executeSafeQuery(`CALL proc_create_movements_table(?)`, [data.username]);
    const movements = await this.movement(data);
    const balance = await this.balance(data);
    const movementTag = await this.movementTag(data);
    const totalDay = await this.totalDay(data);
    const balanceUntilDate = await this.balanceUntilDate(data);
    const totalBank = await this.totalBank(data);
    let ret = {};

    if (data.username === 'anderokgo') {
      const generalInfo = await this.generalInfo();
      const tripInfo = await this.tripInfo();
      ret = { movements, balance, movementTag, totalDay, generalInfo, tripInfo, balanceUntilDate, totalBank };
    } else {
      ret = { movements, balance, movementTag, totalDay, balanceUntilDate, totalBank };
    }
    return ret;
  }

  public async totalBank(data: DataParams) {
    const full_query = `CALL proc_view_total_bank(?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency]);
    return resp[0];
  }

  public async totalDay(data: DataParams) {
    const { username, currency, date } = data;
    const full_query = `CALL proc_view_total_day(?, ?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [username, currency, date, this.Limit]);
    return resp[0];
  }

  public async balance(data: DataParams) {
    const full_query = `CALL proc_view_monthly_expenses_incomes_order_row(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);

    return resp[0];
  }

  public async movement(data: DataParams) {
    const full_query = `CALL proc_view_movements(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);
    return resp[0];
  }

  public async movementSources(data: DataParams) {
    const full_query = `CALL proc_view_monthly_movements_order_by_source(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.currency, data.username, this.Limit]);
    return resp[0];
  }

  public async movementTag(data: DataParams) {
    const full_query = `CALL proc_view_monthly_movements_order_by_tag(?, ?, ?)`;
    const resp = await this.Database.executeSafeQuery(full_query, [data.username, data.currency, this.Limit]);
    return resp[0];
  }

  public async generalInfo() {
    const full_query = `SELECT * FROM view_general_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async balanceUntilDate(data: DataParams) {
    const full_query = `CALL proc_view_balance_until_date(?, ?, ?, ?, ?)`;
    const arr = [data.currency, data.username, 'Date_movement', 'DESC', this.Limit];
    const resp = await this.Database.executeSafeQuery(full_query, arr);
    return resp[0];
  }

  public async tripInfo() {
    const full_query = `SELECT * FROM view_final_trip_info`;
    return await this.Database.executeSafeQuery(full_query);
  }

  public async putMovement(parameters: any) {
    const { movement_name, movement_val, movement_date } = parameters;
    const { movement_type, movement_tag, currency, username } = parameters;
    const a = [movement_name, movement_val, movement_date, movement_type, movement_tag, currency, username];
    const full_query = `CALL proc_insert_movement(?, ?, ?, ?, ?, ?, ?)`;
    return await this.Database.executeSafeQuery(full_query, a);
  }

  public async updateMovementById(id: number, parameters: any) {
    const { movement_name, movement_val, movement_date } = parameters;
    const { movement_type, movement_tag, currency, username } = parameters;
    const a = [id, movement_name, movement_val, movement_date, movement_type, movement_tag, currency, username];
    const full_query = `CALL proc_update_movement(?, ?, ?, ?, ?, ?, ?, ?)`;
    return await this.Database.executeSafeQuery(full_query, a);
  }

  public async deleteMovementById(id: number, username: string) {
    const full_query = `CALL proc_delete_movement(?,?)`;
    return await this.Database.executeSafeQuery(full_query, [id, username]);
  }
}
