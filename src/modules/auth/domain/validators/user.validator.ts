// Validaciones de dominio - reglas de negocio para usuarios
export class UserValidator {
  private static readonly MIN_NAME_LENGTH = 2;
  private static readonly MIN_USERNAME_LENGTH = 3;
  private static readonly USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;

  static validateUsername(username: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!username) {
      errors.push('Username is required');
      return { isValid: false, errors };
    }

    if (username.length < this.MIN_USERNAME_LENGTH) {
      errors.push(`Username must be at least ${this.MIN_USERNAME_LENGTH} characters`);
    }

    if (!this.USERNAME_PATTERN.test(username)) {
      errors.push('Username can only contain letters, numbers, and underscores');
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateName(name: string, fieldName: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!name) {
      errors.push(`${fieldName} is required`);
      return { isValid: false, errors };
    }

    if (name.length < this.MIN_NAME_LENGTH) {
      errors.push(`${fieldName} must be at least ${this.MIN_NAME_LENGTH} characters`);
    }

    return { isValid: errors.length === 0, errors };
  }

  static validateEmail(email: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      errors.push('Email is required');
      return { isValid: false, errors };
    }

    if (!emailPattern.test(email)) {
      errors.push('Valid email is required');
    }

    return { isValid: errors.length === 0, errors };
  }
}
