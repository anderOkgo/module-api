import { Database, HDB } from '../../../helpers/my.database.helper';
import Production from '../../series/domain/models/Series';
import { ProductionRepository } from './repositories/serie.repository';

export class ProductionMysqlRepository implements ProductionRepository {
  private Database: Database;

  constructor() {
    this.Database = new Database('MYDATABASEANIME');
  }

  public async getProductions(production: Production) {
    const view_name: string = 'view_all_info_produtions';
    let conditions: string = '';
    let full_query: string = '';
    let initial_query: string = `select * FROM ${view_name} WHERE 1`;
    const Pro = production;

    Object.keys(Pro).forEach((key: string, obj) => {
      if (key === 'production_name' && Pro[key] !== undefined)
        conditions += HDB.generateLikeCondition('production_name', Pro.production_name);
      if (key === 'production_number_chapters' && Pro[key] !== undefined)
        conditions += HDB.generateBetweenCondition('production_number_chapters', Pro.production_number_chapters);
      if (key === 'production_description' && Pro[key] !== undefined)
        conditions += HDB.generateLikeCondition('production_description', Pro.production_description);
      if (key === 'production_year' && Pro[key] !== undefined)
        conditions += HDB.generateBetweenCondition('production_year', Pro.production_year);
      if (key === 'demographic_name' && Pro[key] !== undefined)
        conditions += HDB.generateEqualCondition('demographic_name', Pro.demographic_name);
      if (key === 'genre_names' && Pro[key] !== undefined)
        conditions += HDB.generateAndCondition('genre_names', Pro.genre_names);
      if (key == 'id' && Pro[key] !== undefined) conditions += HDB.generateInCondition('id', Pro.id);
    });

    conditions += ` order by production_ranking_number ASC`;
    conditions += HDB.generateLimit('limit', Pro.limit);
    full_query = initial_query + conditions;
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }

  public async getProductionYears() {
    let full_query = 'SELECT * from view_all_years_productions';
    try {
      return await this.Database.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    }
  }
}
