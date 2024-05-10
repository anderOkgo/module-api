interface RequestBody {
  currency?: any;
  movement_name?: any;
  movement_val?: any;
  movement_date?: any;
  movement_type?: any;
  movement_tag?: any;
  id?: any;
}

export interface ValidationResult {
  error: boolean;
  errors: string[];
}

// Validation function to check if a string is empty or undefined
export const isEmpty = (str: string | undefined): boolean => {
  return !str || (typeof str === 'string' && str.trim().length === 0);
};

// Validation function to check if a number is positive
export const isPositiveNumber = (num: number | undefined): boolean => {
  return num !== undefined && num > 0;
};

// Validation function to check if a value is a number
export const isNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value);
};

// Function to validate the request body for getInitialLoads endpoint
export const validateGetInitialLoads = (body: RequestBody): ValidationResult => {
  const errors: string[] = [];
  if (isEmpty(body.currency)) {
    errors.push('Currency cannot be empty');
  }
  return { error: errors.length > 0, errors };
};

const isValidDate = (dateString: any) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

// Function to validate the request body for putMovements endpoint
export const validatePutMovements = (body: RequestBody): ValidationResult => {
  const errors: string[] = [];
  if (isEmpty(body.movement_name)) {
    errors.push('Movement name cannot be empty');
  }
  if (!isNumber(body.movement_val)) {
    errors.push('Movement value must be a number');
  }
  if (!isValidDate(body.movement_date)) {
    errors.push('Movement date is invalid');
  }
  if (isEmpty(body.movement_date)) {
    errors.push('Movement date cannot be empty');
  }
  if (isEmpty(body.movement_type)) {
    errors.push('Movement type cannot be empty');
  }
  if (!isNumber(body.movement_type)) {
    errors.push('Movement type must be a number');
  }
  if (isEmpty(body.movement_tag)) {
    errors.push('Movement tag cannot be empty');
  }
  if (isEmpty(body.currency)) {
    errors.push('Currency cannot be empty');
  }
  return { error: errors.length > 0, errors };
};

// Function to validate the request body for updateMovements endpoint
export const validateUpdateMovements = (body: RequestBody, id: any): ValidationResult => {
  const errors: string[] = [];
  if (!isNumber(body.movement_val)) {
    errors.push('Movement value must be a number');
  }
  if (!isValidDate(body.movement_date)) {
    errors.push('Movement date is invalid');
  }
  if (isEmpty(body.movement_date)) {
    errors.push('Movement date cannot be empty');
  }
  if (isEmpty(body.movement_type)) {
    errors.push('Movement type cannot be empty');
  }
  if (!isNumber(body.movement_type)) {
    errors.push('Movement type must be a number');
  }
  if (isEmpty(body.movement_tag)) {
    errors.push('Movement tag cannot be empty');
  }
  if (!isNumber(id)) {
    errors.push('ID is invalid');
  }
  if (isEmpty(body.currency)) {
    errors.push('Currency cannot be empty');
  }
  return { error: errors.length > 0, errors };
};

// Function to validate the request body for deleteMovements endpoint
export const validateDeleteMovements = (id: any): ValidationResult => {
  const errors: string[] = [];
  if (!isNumber(id)) {
    errors.push('ID is invalid');
  }
  return { error: errors.length > 0, errors };
};
