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
        conditions.push(conditionMap[key](key, value));
        conditionsVals.push(value);
      }
    }

    conditions.push(HDB.generateOrderBy('production_ranking_number', 'ASC'));
    conditions.push(HDB.generateLimit());
    const fullQuery = `${initialQuery} ${conditions.join(' ')}`;
    conditionsVals.push(parseInt(production.limit));

    try {
      return await this.database.executeQuery(fullQuery, conditionsVals); // Pass limit value here
    } catch (e) {
      console.error(e);
    }
  }

  public async getProductionYearRepository() {
    const fullQuery: string = 'SELECT * FROM view_all_years_productions';

    try {
      return await this.database.executeQuery(fullQuery);
    } catch (e) {
      console.error(e);
    }
  }
}
