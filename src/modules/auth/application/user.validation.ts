import { isValidEmail } from '../../../infrastructure/validatios.helper';
import User from '../domain/models/User';
import Login from '../domain/models/Login';

export const validateUser = (data: any): { error: boolean; data?: User; message?: string } => {
  if (!data || Object.keys(data).length === 0) {
    return { error: true, message: 'User object is empty' };
  }

  if (!data.email || !isValidEmail(data.email)) {
    return { error: true, message: 'Invalid email' };
  }

  return { error: false, data };
};

export const validateLogin = (data: any): { error: boolean; data?: Login; message?: string } => {
  if (!data || !data.username || !data.password) {
    return { error: true, message: 'Incomplete login data' };
  }

  return { error: false, data };
};
