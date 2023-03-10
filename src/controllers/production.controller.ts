import { Request, Response } from 'express';
import connection from '../db/connection';

export const getProductions = (req: Request, res: Response) => {
  let conditions: string = '';
  let sql: string;

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
      conditions = ` AND pro_name LIKE "%${pro_name}%"`;
    if (req.body[key] === chapter_numer) {
      let sp = chapter_numer.split(',');
      if (sp.length == 1) {
        conditions += ` AND chapter_numer = ${chapter_numer}`;
      } else if (sp.length == 2) {
        conditions += ` AND chapter_numer BETWEEN ${sp[0]} and ${sp[1]}`;
      }
    }
    if (req.body[key] === description)
      conditions += ` AND description LIKE "%${description}%"`;
    if (req.body[key] === YEAR) {
      let sp = YEAR.split(',');
      if (sp.length == 1) {
        conditions += ` AND YEAR = ${YEAR}`;
      } else if (sp.length == 2) {
        conditions += ` AND YEAR BETWEEN ${sp[0]} and ${sp[1]}`;
      }
    }
    if (req.body[key] === demo_names)
      conditions += ` AND demo_names LIKE "%${demo_names}%"`;
    if (req.body[key] === genre_names)
      conditions += ` AND genre_names LIKE "%${genre_names}%"`;
  });
  sql = 'SELECT * FROM v_all_info_produtions WHERE 1';
  console.log(sql + conditions);
  connection.query(sql + conditions, (err, data) => !err && res.json({ data }));
};
