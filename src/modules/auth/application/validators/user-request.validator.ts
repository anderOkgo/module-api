import { UserValidator } from '../../domain/validators/user.validator';
import { PasswordValidator } from '../../domain/validators/password.validator';
import { UserCreateRequest } from '../../domain/models/User';
import Login from '../../domain/models/Login';

export interface ValidationResult {
  error: boolean;
  data?: any;
  message?: string;
  details?: string[];
}

export class UserRequestValidator {
  static validateUserCreate(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data || Object.keys(data).length === 0) {
      return { error: true, message: 'User data is required', details: ['User object is empty'] };
    }

    // Validar nombre
    const firstNameValidation = UserValidator.validateName(data.first_name, 'First name');
    if (!firstNameValidation.isValid) {
      errors.push(...firstNameValidation.errors);
    }

    // Validar apellido
    const lastNameValidation = UserValidator.validateName(data.last_name, 'Last name');
    if (!lastNameValidation.isValid) {
      errors.push(...lastNameValidation.errors);
    }

    // Validar username
    const usernameValidation = UserValidator.validateUsername(data.username);
    if (!usernameValidation.isValid) {
      errors.push(...usernameValidation.errors);
    }

    // Validar email
    const emailValidation = UserValidator.validateEmail(data.email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }

    // Validar contraseña
    const passwordValidation = PasswordValidator.validate(data.password);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    if (errors.length > 0) {
      return { error: true, message: 'Validation failed', details: errors };
    }

    return { error: false, data };
  }

  static validateLogin(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data) {
      return { error: true, message: 'Login data is required', details: ['Login object is empty'] };
    }

    if (!data.password) {
      errors.push('Password is required');
    }

    if (!data.username && !data.email) {
      errors.push('Username or email is required');
    }

    if (data.username) {
      const usernameValidation = UserValidator.validateUsername(data.username);
      if (!usernameValidation.isValid) {
        errors.push(...usernameValidation.errors);
      }
    }

    if (data.email) {
      const emailValidation = UserValidator.validateEmail(data.email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      }
    }

    if (errors.length > 0) {
      return { error: true, message: 'Login validation failed', details: errors };
    }

    return { error: false, data };
  }
}
