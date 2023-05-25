import Production from '../../production/domain/models/Prodution';
import { ProductionRepository } from '../domain/repositories/production.repository';
import Database from '../../../data/mysql/database';
import {
  generateInCondition,
  generateLikeCondition,
  generateEqualCondition,
  generateLimit,
  generateBetweenCondition,
  generateAndCondition,
} from '../../../helpers/mysql.helper';

export class ProductionMysqlRepository implements ProductionRepository {
  private connection: any;

  constructor() {
    this.connection = new Database();
  }

  public getProductions(production: Production) {
    const view_name: string = 'view_all_info_produtions';
    let conditions: string = '';
    let full_query: string = '';
    let initial_query: string = `select * FROM ${view_name} WHERE 1`;
    const {
      id,
      production_name,
      production_number_chapters,
      production_description,
      production_year,
      demographic_name,
      genre_names,
      limit,
    } = production;

    console.log(production);

    Object.keys(production).forEach((key: string, obj) => {
      if (key === 'production_name' && production[key] !== undefined)
        conditions += generateLikeCondition('production_name', production_name);
      if (key === 'production_number_chapters' && production[key] !== undefined)
        conditions += generateBetweenCondition('production_number_chapters', production_number_chapters);
      if (key === 'production_description' && production[key] !== undefined)
        conditions += generateLikeCondition('production_description', production_description);
      if (key === 'production_year' && production[key] !== undefined)
        conditions += generateBetweenCondition('production_year', production_year);
      if (key === 'demographic_name' && production[key] !== undefined)
        conditions += generateEqualCondition('demographic_name', demographic_name);
      if (key === 'genre_names' && production[key] !== undefined)
        conditions += generateAndCondition('genre_names', genre_names);
      if (key == 'id' && production[key] !== undefined) conditions += generateInCondition('id', id);
    });

    conditions += ` order by production_ranking_number ASC`;
    conditions += generateLimit('limit', limit);
    full_query = initial_query + conditions;
    console.log(full_query);
    try {
      return this.connection.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    } finally {
      //this.connection.close();
    }
  }

  public getProductionYears() {
    let full_query = 'SELECT * from view_all_years_productions';
    try {
      return this.connection.executeQuery(full_query);
    } catch (e) {
      console.log(e);
    } finally {
      //this.connection.close();
    }
  }
}
