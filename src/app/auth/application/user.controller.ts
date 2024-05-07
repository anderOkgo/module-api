import { Request, Response } from '../../../helpers/middle.helper';
import { addUser, loginUser } from '../domain/services/index';

export const defaultUsers = async (req: Request, res: Response) => {
  res.json({ msg: `API Users Working` });
};

interface User {
  first_name: string;
  password: string;
  email: string;
  verificationCode?: string; // Optional field
}

export const addUsers = async (req: Request, res: Response) => {
  try {
    // Extract the user data from the request body
    const userData: User = req.body;

    // Validate the user data against the expected interface

    return res.status(400).json({ error: 'Invalid user data' });
  } catch (error) {
    // If an exception occurs during processing, log the error and return a 500 Internal Server Error response
    console.error('An error occurred:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
};

export const loginUsers = async (req: Request, res: Response) => {
  const login = await loginUser(req.body);
  login ? res.status(200).json(login) : res.status(404).json({ error: 'User not found' });
};
