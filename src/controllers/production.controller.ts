import { Request, Response } from 'express';
import connection from '../db/connection';

export const getProductions = (req: Request, res: Response) => {
  let conditions: string = '';
  let select: string = 'SELECT * FROM v_all_info_produtions WHERE 1';
  let query: string = '';

  const {
    pro_name,
    chapter_numer,
    description,
    YEAR,
    demo_names,
    genre_names,
    limit,
  } = req.body;

  Object.keys(req.body).forEach((key) => {
    if (key === 'pro_name')
      conditions += generateConditionLike('pro_name', pro_name);
    if (key === 'chapter_numer')
      conditions += generateConditionParts('chapter_numer', chapter_numer);
    if (key === 'description')
      conditions += generateConditionLike('description', description);
    if (key === 'YEAR') conditions += generateConditionParts('YEAR', YEAR);
    if (key === 'demo_names')
      conditions += generateConditionEq('demo_names', demo_names);
    if (key === 'genre_names')
      conditions += generateConditionPartsAnd('genre_names', genre_names);
  });

  conditions += generateLimit('limit', limit);
  query = select + conditions;
  console.log(query);
  connection.query(query, (err, data) => !err && res.json({ data }));
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
  let parts: string[] = val.split(',');
  let str: string = '';

  if (parts.length === 1) return ` AND ${label} = "${val}"`;
  parts.forEach((elemet) => (str += ` AND ${label} like "%${elemet}%"`));
  return str;
};

const generateLimit = (label: string, val: string) =>
  val === undefined || parseInt(val) > 1000
    ? ` ${label} 100`
    : ` ${label} ` + val;
