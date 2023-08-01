import { Database, HDB } from '../../../helpers/database.helper';
import Production from '../../production/domain/models/Prodution';
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
}
