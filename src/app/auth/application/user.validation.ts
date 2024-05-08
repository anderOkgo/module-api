import { Request } from '../../../helpers/middle.helper';
import User from '../domain/models/User';
import Login from '../domain/models/Login';

// Validation function for adding users
export const validateUser = (data: any): { error: boolean; data?: User; message?: string } => {
  // Perform validation checks here
  if (!data || Object.keys(data).length === 0) {
    return { error: true, message: 'User object is empty' };
  }

  // Check if email is provided and follows a valid format
  if (!data.email || !isValidEmail(data.email)) {
    return { error: true, message: 'Invalid email' };
  }

  return { error: false, data };
};

// Validation function for user login
export const validateLogin = (data: any): { error: boolean; data?: Login; message?: string } => {
  // Perform validation checks here
  if (!data || !data.first_name || !data.password) {
    return { error: true, message: 'Incomplete login data' };
  }

  // You can add more specific validation checks here

  return { error: false, data };
};

// Function to validate email format
const isValidEmail = (email: string): boolean => {
  // Regular expression to validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
