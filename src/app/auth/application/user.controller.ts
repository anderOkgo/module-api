import { Request, Response } from '../../../helpers/middle.helper';
import { addUser, loginUser } from '../domain/services/index';
import { validateUser, validateLogin } from './user.validation'; // Import validation functions

export const defaultUsers = async (req: Request, res: Response) => {
  res.json({ msg: `API Users Working` });
};

export const addUsers = async (req: Request, res: Response) => {
  // Validate user data
  const validation = validateUser(req.body);
  if (validation.error) {
    return res.status(400).json(validation);
  }

  // If validation passes, proceed to addUser service
  const user = await addUser(req.body);
  !user.error ? res.status(200).json(user) : res.status(404).json(user);
};

export const loginUsers = async (req: Request, res: Response) => {
  // Validate login data
  const validation = validateLogin(req.body);
  if (validation.error) {
    return res.status(400).json(validation);
  }

  // If validation passes, proceed to loginUser service
  const login = await loginUser(req.body);
  login ? res.status(200).json(login) : res.status(404).json({ error: 'User not found' });
};
