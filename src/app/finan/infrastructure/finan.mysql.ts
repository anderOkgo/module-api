import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
  }

  public async getTotalBank() {
    let moviments = await this.moviments();
    let balance = await this.balance();
    let movimentTag = await this.movimentTag();
    let movimentSources = await this.movimentSources();
    let totalDay = await this.totalDay();

    let full_query = 'SELECT * from view_total_bank';
    try {
      let tota_bank = await this.Database.executeQuery(full_query);
      return { balance, tota_bank, movimentSources, movimentTag, moviments, totalDay };
    } catch (e) {
      console.log(e);
    }
  }

  public async totalDay() {
    let full_query = 'SELECT * from view_tota_day';
    try {
      return await this.Database.executeQuery(full_query);
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

  public async moviments() {
    let full_query = 'SELECT * from view_moviments';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movimentSources() {
    let full_query = 'SELECT * from view_monthly_movements_order_by_source';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movimentTag() {
    let full_query = 'SELECT * from view_monthly_movements_order_by_tag';
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
