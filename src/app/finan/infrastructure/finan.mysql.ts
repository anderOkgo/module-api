import { Database, HDB } from '../../../helpers/database.helper';
import { FinanRepository } from './repositories/finan.repository';

export class FinanMysqlRepository implements FinanRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEFINAN');
  }

  public async getTotalBank() {
    let full_query = 'SELECT * from total_bank';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async putMoviment(parameters: any) {
    const { name, val, datemov, type, tag } = parameters;
    let full_query = `CALL insert_moviment(${this.Database.myScape(
      name
    )},${val},'${datemov}',${type},${this.Database.myScape(tag)})`;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }
}
