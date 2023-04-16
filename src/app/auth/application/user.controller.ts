import { Request, Response } from 'express';
import { addUserRepository, loginUserRepository } from '../domain/user.repository';

export const addUser = async (req: Request, res: Response) => {
  return addUserRepository(req, res);
};

export const loginUser = (req: Request, res: Response) => {
  return loginUserRepository(req, res);
};
