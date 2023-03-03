import { Request, Response } from "express";
import connection from "../db/connection";

export const getProductions = (req: Request, res: Response) => {
  connection.query("SELECT name FROM productions", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      res.json({
        data,
      });
    }
  });
};
