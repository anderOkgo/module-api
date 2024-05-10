import { Request, Response } from '../../../helpers/middle.helper';
import { addUser, loginUser } from '../domain/services/index';
import { validateUser, validateLogin } from './user.validation'; // Import validation functions

export const defaultUsers = async (req: Request, res: Response) => res.json({ msg: `API Users Working` });

export const addUsers = async (req: Request, res: Response) => {
  const validation = validateUser(req.body);
  if (validation.error) return res.status(400).json(validation);
  const resp = await addUser(req.body);
  if (resp.errorSys) res.status(500).json({ error: true, message: 'Internal server error' });
  resp.error ? res.status(404).json(resp) : res.status(200).json(resp);
};

export const loginUsers = async (req: Request, res: Response) => {
  const validation = validateLogin(req.body);
  if (validation.error) return res.status(400).json(validation);
  const resp = await loginUser(req.body);
  if (resp.errorSys) res.status(500).json({ error: true, message: 'Internal server error' });
  resp.error ? res.status(404).json(resp) : res.status(200).json(resp);
};
