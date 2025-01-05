import { Request, Response } from '../../../infrastructure/middle.helper';
import { addUserService, loginUserService } from '../domain/services/index';
import { validateUser, validateLogin } from './user.validation';

export const defaultUser = async (req: Request, res: Response) => res.json({ msg: `API Users Working` });

export const addUser = async (req: Request, res: Response) => {
  const validation = validateUser(req.body);
  if (validation.error) return res.status(400).json(validation);

  const resp = await addUserService(req.body);
  if (resp.errorSys) return res.status(500).json(resp.message);
  return resp.error ? res.status(404).json(resp.message) : res.status(200).json(resp.message);
};

export const loginUser = async (req: Request, res: Response) => {
  const validation = validateLogin(req.body);
  if (validation.error) return res.status(400).json(validation);

  const resp = await loginUserService(req.body);
  if (resp.errorSys) return res.status(500).json(resp.message);
  return resp.error ? res.status(404).json(resp.message) : res.status(200).json({ token: resp.token });
};
