import { Request, Response } from 'express';
import connection from '../db/connection';

export const getProductions = (req: Request, res: Response) => {
  let conditions: string = '';
  let sql: string = 'SELECT * FROM v_all_info_produtions WHERE 1';

  const {
    pro_name,
    chapter_numer,
    description,
    YEAR,
    demo_names,
    genre_names,
  } = req.body;

  Object.keys(req.body).forEach((key) => {
    if (req.body[key] === pro_name)
      conditions += generateConditionLike('pro_name', req.body[key]);
    if (req.body[key] === chapter_numer)
      conditions += generateConditionParts('chapter_numer', req.body[key]);
    if (req.body[key] === description)
      conditions += generateConditionLike('description', req.body[key]);
    if (req.body[key] === YEAR)
      conditions += generateConditionParts('YEAR', req.body[key]);
    if (req.body[key] === demo_names)
      conditions += generateConditionEq('demo_names', req.body[key]);
    if (req.body[key] === genre_names)
      conditions += generateConditionPartsAnd('genre_names', req.body[key]);
  });

  console.log(sql + conditions);
  connection.query(sql + conditions, (err, data) => !err && res.json({ data }));
};

const generateConditionLike = (label: string, val: string) =>
  ` AND ${label} LIKE "%${val}%"`;

const generateConditionEq = (label: string, val: string) =>
  ` AND ${label} = "${val}"`;

const generateConditionParts = (label: string, val: string) => {
  let part: string[] = val.split(',');

  if (part.length === 1) return ` AND ${label} = ${val}`;
  else if (part.length >= 2)
    return ` AND ${label} BETWEEN ${part[0]} and ${part[1]}`;
};

const generateConditionPartsAnd = (label: string, val: string) => {
  let part: string[] = val.split(',');
  let str: string = '';

  if (part.length === 1) return ` AND ${label} = ${val}`;
  part.forEach((e) => (str += ` AND ${label} like "%${e}%"`));
  return str;
};
