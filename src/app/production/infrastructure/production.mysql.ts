import { Request, Response } from 'express';
import connection from '../../../data/mysql/connection';
import {
  generateinCondition,
  generateLikeCondition,
  generateEqualCondition,
  generateLimit,
  generateBetweenCondition,
  generateAndCondition,
} from '../../../helpers/mysql.helper';

export const getProductionsPersistence = (req: Request, res: Response) => {
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
  } = req.body;

  Object.keys(req.body).forEach((key: string) => {
    if (key === 'production_name') conditions += generateLikeCondition('production_name', production_name);
    if (key === 'production_number_chapters')
      conditions += generateBetweenCondition('production_number_chapters', production_number_chapters);
    if (key === 'production_description')
      conditions += generateLikeCondition('production_description', production_description);
    if (key === 'production_year') conditions += generateBetweenCondition('production_year', production_year);
    if (key === 'demographic_name')
      conditions += generateEqualCondition('demographic_name', demographic_name);
    if (key === 'genre_names') conditions += generateAndCondition('genre_names', genre_names);
    if (key == 'id') conditions += generateinCondition('id', id);
  });

  conditions += ` order by production_ranking_number ASC`;
  conditions += generateLimit('limit', limit);
  full_query = initial_query + conditions;
  console.log(full_query);
  connection.query(full_query, (err, data) => !err && res.json({ data }));
};

export const getProductionYearsPersistence = (req: Request, res: Response) => {
  let full_query = 'SELECT * from view_all_years_productions';
  connection.query(full_query, (err, data) => !err && res.json({ data }));
};
