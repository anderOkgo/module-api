import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
  }

  public async getTotalBank() {
    let balance = await this.balance();
    let MovimentSources = await this.MovimentSources();
    let full_query = 'SELECT * from view_total_bank';
    try {
      let tota_bank = await this.Database.executeQuery(full_query);
      return { balance, tota_bank, MovimentSources };
    } catch (e) {
      console.log(e);
    }
  }

  public async balance() {
    let full_query = 'SELECT * from view_monthly_bills_incomes_order_row';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async MovimentSources() {
    let full_query = 'SELECT * from view_monthly_movements_order_by_source';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async putMoviment(parameters: any) {
    const { name, val, datemov, type, tag } = parameters;
    let full_query = `CALL proc_insert_moviment(
      ${this.Database.myScape(name)},
      ${val},
      '${datemov}',
      ${type},
      ${this.Database.myScape(tag)}
      );`;
    console.log(full_query);
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }
}
