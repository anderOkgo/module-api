import { Request, Response } from 'express';
import connection from '../db/connection';

export const getProductions = (req: Request, res: Response) => {
  const view_name: string = 'view_all_info_produtions';
  let conditions: string = '';
  let full_query: string = '';
  let initial_query: string = `select * FROM ${view_name} WHERE 1`;
  const {
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
  });

  conditions += generateLimit('limit', limit);
  full_query = initial_query + conditions;
  console.log(full_query);
  connection.query(full_query, (err, data) => !err && res.json({ data }));
};

export const getProductionYears = (req: Request, res: Response) => {
  let full_query = 'SELECT * from view_all_years_productions';
  connection.query(full_query, (err, data) => !err && res.json({ data }));
};

const generateLikeCondition = (label: string, val: string) => ` AND ${label} LIKE "%${val}%"`;
const generateEqualCondition = (label: string, val: string) => ` AND ${label} = "${val}"`;
const generateLimit = (label: string, val: string) =>
  val === undefined || parseInt(val) > 1000 ? ` ${label} 100` : ` ${label} ` + val;

const generateBetweenCondition = (label: string, val: string) => {
  let parts: string[] = val.split(',');
  if (parts.length === 1) return ` AND ${label} = ${val}`;
  else if (parts.length >= 2) return ` AND ${label} BETWEEN ${parts[0]} and ${parts[1]}`;
};

const generateAndCondition = (label: string, val: string) => {
  let parts: string[] = val.split(',');
  let str: string = '';
  if (parts.length === 1) return ` AND ${label} = "${val}"`;
  parts.forEach((e) => (str += ` AND ${label} like "%${e}%"`));
  return str;
};
