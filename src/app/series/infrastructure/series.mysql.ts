import { Database, HDB } from '../../../helpers/my.database.helper';
import Series from '../domain/models/Series';
import { ProductionRepository } from './repositories/series.repository';

export class ProductionMysqlRepository implements ProductionRepository {
  private database: Database;

  constructor() {
    this.database = new Database('MYDATABASEANIME');
  }

  public async getProductionRepository(production: Series) {
    const viewName = 'view_all_info_produtions';
    const initialQuery = `SELECT * FROM ${viewName} WHERE 1`;
    const conditions: string[] = [];
    const conditionsVals: any[] = [];

    const conditionMap: Record<string, (label: string, value: any) => string> = {
      production_name: HDB.generateLikeCondition,
      production_number_chapters: HDB.generateBetweenCondition,
      production_description: HDB.generateLikeCondition,
      production_year: HDB.generateBetweenCondition,
      demographic_name: HDB.generateEqualCondition,
      genre_names: HDB.generateAndCondition,
      id: HDB.generateInCondition,
    };

    for (const [key, value] of Object.entries(production)) {
      if (conditionMap[key]) {
        conditions.push(conditionMap[key](key, value)); // call the HDB fucntion to get a SQL string
        conditionsVals.push(value); // push the value for the previous SQL string
      }
    }

    conditions.push(HDB.generateOrderBy('production_ranking_number', 'ASC'));
    conditions.push(HDB.generateLimit());
    const fullQuery = `${initialQuery} ${conditions.join(' ')}`; // create full SQL string
    conditionsVals.push(parseInt(production.limit));
    const mergedArray: any[] = [];
    conditionsVals.forEach((element) => {
      if (Array.isArray(element)) {
        mergedArray.push(...element); // flat the array
      } else {
        mergedArray.push(element);
      }
    });

    return await this.database.executeSafeQuery(fullQuery, mergedArray);
  }

  public async getProductionYearRepository() {
    const fullQuery: string = 'SELECT * FROM view_all_years_productions';
    return await this.database.executeSafeQuery(fullQuery);
  }
}
