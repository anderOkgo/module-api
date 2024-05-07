import { Request, Response } from '../../../helpers/middle.helper';
import { addUser, loginUser } from '../domain/services/index';

export const defaultUsers = async (req: Request, res: Response) => {
  res.json({ msg: `API Users Working` });
};

export const addUsers = async (req: Request, res: Response) => {
  const user = await addUser(req.body);
  !user.error ? res.status(200).json({ message: user.message }) : res.status(404).json({ errors: user.errors });
};

export const loginUsers = async (req: Request, res: Response) => {
  const login = await loginUser(req.body);
  login ? res.status(200).json(login) : res.status(404).json({ error: 'User not found' });
};
