import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
  }

  public async getTotalBank(data: any) {
    let moviments = await this.moviments();
    let balance = await this.balance();
    let movimentTag = await this.movimentTag();
    let movimentSources = await this.movimentSources();
    let totalDay = await this.totalDay(data);
    let generalInfo = await this.generalInfo();
    let tripInfo = await this.tripInfo();
    let full_query = 'SELECT * from view_total_bank';

    try {
      let tota_bank = await this.Database.executeQuery(full_query);
      return { balance, tota_bank, movimentSources, movimentTag, moviments, totalDay, generalInfo, tripInfo };
    } catch (e) {
      console.log(e);
    }
  }

  public async totalDay(data: any) {
    let full_query = `SELECT * from view_tota_day  WHERE DATE(date_moviment) = '${data}'`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async balance() {
    let full_query = 'SELECT * from view_monthly_bills_incomes_no_exchange_order_row';
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

  public async generalInfo() {
    let full_query = 'SELECT * from view_general_info';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async tripInfo() {
    let full_query = 'SELECT * from view_final_trip_info';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async putMoviment(parameters: any) {
    const { name, val, datemov, type, tag } = parameters;
    let full_query = `CALL proc_insert_moviment(
      ${this.Database.myEscape(name)},
      ${val},
      '${datemov}',
      ${type},
      ${this.Database.myEscape(tag)}
      );`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async updateMovimentById(id: number, parameters: any) {
    const { name, val, datemov, type, tag } = parameters;
    let full_query = `
      UPDATE moviments
      SET
        name = ${this.Database.myEscape(name)},
        value = ${val},
        date_moviment = '${datemov}',
        type_source_id = ${type},
        tag = ${this.Database.myEscape(tag)}
      WHERE
        id = ${id};
    `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async deleteMovimentById(id: number) {
    let full_query = `
      DELETE FROM moviments
      WHERE
        id = ${id};
    `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }
}
