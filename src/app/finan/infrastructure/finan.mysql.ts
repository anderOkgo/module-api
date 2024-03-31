import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
  }

  public async getTotalBank(data: any) {
    let movements = await this.movements();
    let balance = await this.balance();
    let movementTag = await this.movementTag();
    let movementSources = await this.movementSources();
    let totalDay = await this.totalDay(data);
    let generalInfo = await this.generalInfo();
    let tripInfo = await this.tripInfo();
    let balanceUntilDate = await this.balanceUntilDate();
    let full_query = 'SELECT * from view_total_bank';

    try {
      let tota_bank = await this.Database.executeQuery(full_query);
      return {
        balance,
        tota_bank,
        movementSources,
        movementTag,
        movements,
        totalDay,
        generalInfo,
        tripInfo,
        balanceUntilDate,
      };
    } catch (e) {
      console.log(e);
    }
  }

  public async totalDay(data: any) {
    let full_query = `SELECT * from view_tota_day  WHERE DATE(date_movement) = '${data}'`;
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

  public async movements() {
    let full_query = 'SELECT * from view_movements';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementSources() {
    let full_query = 'SELECT * from view_monthly_movements_order_by_source';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementTag() {
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

  public async balanceUntilDate() {
    let full_query = 'SELECT * from view_balance_until_date ORDER BY Date_movement DESC LIMIT 100';
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

  public async putMovement(parameters: any) {
    const { name, val, datemov, type, tag } = parameters;
    let full_query = `CALL proc_insert_movement(
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

  public async updateMovementById(id: number, parameters: any) {
    const { name, val, datemov, type, tag } = parameters;
    let full_query = `
      UPDATE movements
      SET
        name = ${this.Database.myEscape(name)},
        value = ${val},
        date_movement = '${datemov}',
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

  public async deleteMovementById(id: number) {
    let full_query = `
      DELETE FROM movements
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
