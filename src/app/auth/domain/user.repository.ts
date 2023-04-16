import { Request, Response } from 'express';
import { addUserPersistence, loginUserPersistence } from '../infrastructure/user.mysql';

export const addUserRepository = (req: Request, res: Response) => {
  return addUserPersistence(req, res);
};

export const loginUserRepository = (req: Request, res: Response) => {
  return loginUserPersistence(req, res);
};
