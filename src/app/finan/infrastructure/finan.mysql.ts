import { Database, HDB } from '../../../helpers/my.database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
  }

  public async getTotalBank(data: any) {
    let movements = await this.movements(data.currency);
    let balance = await this.balance(data.currency);
    let movementTag = await this.movementTag(data.currency);
    let movementSources = await this.movementSources(data.currency);
    let totalDay = await this.totalDay(data);
    let generalInfo = await this.generalInfo();
    let tripInfo = await this.tripInfo(data.currency);
    let balanceUntilDate = await this.balanceUntilDate(data.currency);
    let full_query = `SELECT * from view_total_bank  where currency = '${data.currency}' `;
    try {
      let totalBank = await this.Database.executeQuery(full_query);
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
    let full_query = `SELECT * from view_total_day  WHERE DATE(date_movement) = '${data.date}' AND currency = '${data.currency}' `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async balance(currency: string) {
    let full_query = `SELECT * from view_monthly_bills_incomes_no_exchange_order_row where currency = '${currency}' `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movements(currency: string) {
    let full_query = `SELECT * from view_movements where currency = '${currency}' `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementSources(currency: string) {
    let full_query = `SELECT * from view_monthly_movements_order_by_source where currency = '${currency}' `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async movementTag(currency: string) {
    let full_query = `SELECT * from view_monthly_movements_order_by_tag where currency = '${currency}' `;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async generalInfo() {
    let full_query = `SELECT * from view_general_info`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async balanceUntilDate(currency: string) {
    let full_query = `SELECT * from view_balance_until_date  where currency = '${currency}' ORDER BY Date_movement DESC LIMIT 100`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async tripInfo(currency: string) {
    let full_query = `SELECT * from view_final_trip_info`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async putMovement(parameters: any) {
    const { name, val, datemov, type, tag, currency } = parameters;
    let full_query = `CALL proc_insert_movement(
      ${this.Database.myEscape(name)},
      ${val},
      '${datemov}',
      ${type},
      ${this.Database.myEscape(tag)},
      '${currency}'
      );`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async updateMovementById(id: number, parameters: any) {
    const { name, val, datemov, type, tag, currency } = parameters;
    let full_query = `
      UPDATE movements
      SET
        name = ${this.Database.myEscape(name)},
        value = ${val},
        date_movement = '${datemov}',
        type_source_id = ${type},
        tag = ${this.Database.myEscape(tag)},
        currency = '${currency}'
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
