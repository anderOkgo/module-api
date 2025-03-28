import { isEmpty, isNumber, isValidDate } from '../../../infrastructure/validatios.helper';
import { RequestBody, ValidationResult } from './finan.repository';

export const isPositiveNumber = (num: number | undefined): boolean => {
  return num !== undefined && num > 0;
};

export const validateGetInitialLoad = (body: RequestBody): ValidationResult => {
  const errors: string[] = [];

  if (isEmpty(body.currency)) {
    errors.push('Currency cannot be empty');
  } else if (body.currency.length !== 3) {
    errors.push('Currency must be a 3-character code');
  }

  return { error: errors.length > 0, errors };
};

export const validatePutMovement = (body: RequestBody): ValidationResult => {
  const errors: string[] = [];

  if (isEmpty(body.movement_name)) {
    errors.push('Movement name cannot be empty');
  } else if (body.movement_name.length > 100) {
    errors.push('Movement name exceeds 100 characters');
  }
  if (!isNumber(body.movement_val)) {
    errors.push('Movement value must be a number');
  } else if (!isPositiveNumber(body.movement_val)) {
    errors.push('Movement value must be positive');
  } else if (body.movement_val > 1e16) {
    errors.push('Value exceeds 16 characters');
  }

  if (isEmpty(body.movement_date)) {
    errors.push('Movement date cannot be empty');
  } else if (!isValidDate(body.movement_date)) {
    errors.push('Movement date is invalid');
  }

  if (isEmpty(body.movement_type)) {
    errors.push('Movement type cannot be empty');
  } else if (!isNumber(body.movement_type)) {
    errors.push('Movement type must be a number');
  }

  if (isEmpty(body.movement_tag)) {
    errors.push('Movement tag cannot be empty');
  } else if (body.movement_tag.length > 60) {
    errors.push('Movement tag exceeds 60 characters');
  }

  if (isEmpty(body.currency)) {
    errors.push('Currency cannot be empty');
  } else if (body.currency.length !== 3) {
    errors.push('Currency must be a 3-character code');
  }

  return { error: errors.length > 0, errors };
};

export const validateUpdateMovements = (body: RequestBody, id: any): ValidationResult => {
  const errors: string[] = [];

  if (!isNumber(id)) {
    errors.push('ID is invalid');
  }

  if (isEmpty(body.movement_name)) {
    errors.push('Movement name cannot be empty');
  } else if (body.movement_name.length > 100) {
    errors.push('Movement name exceeds 100 characters');
  }

  if (!isNumber(body.movement_val)) {
    errors.push('Movement value must be a number');
  } else if (!isPositiveNumber(body.movement_val)) {
    errors.push('Movement value must be positive');
  } else if (body.movement_val > 1e16) {
    errors.push('Value exceeds 16 characters');
  }

  if (isEmpty(body.movement_date)) {
    errors.push('Movement date cannot be empty');
  } else if (!isValidDate(body.movement_date)) {
    errors.push('Movement date is invalid');
  }

  if (isEmpty(body.movement_type)) {
    errors.push('Movement type cannot be empty');
  } else if (!isNumber(body.movement_type)) {
    errors.push('Movement type must be a number');
  }

  if (isEmpty(body.movement_tag)) {
    errors.push('Movement tag cannot be empty');
  } else if (body.movement_tag.length > 60) {
    errors.push('Movement tag exceeds 60 characters');
  }

  if (isEmpty(body.currency)) {
    errors.push('Currency cannot be empty');
  } else if (body.currency.length !== 3) {
    errors.push('Currency must be a 3-character code');
  }

  return { error: errors.length > 0, errors };
};

export const validateDeleteMovement = (id: any): ValidationResult => {
  const errors: string[] = [];

  if (!isNumber(id)) {
    errors.push('ID is invalid');
  }

  return { error: errors.length > 0, errors };
};
