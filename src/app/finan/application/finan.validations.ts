interface RequestBody {
  currency?: string;
  movement_name?: string;
  movement_val?: number;
  movement_date?: string;
  movement_type?: string;
  movement_tag?: string;
  id?: any;
}

export const isEmpty = (str: string | undefined): boolean => {
  return !str || (typeof str === 'string' && str.trim().length === 0);
};

// Validation function to check if a number is not undefined and greater than zero
export const isPositiveNumber = (num: number | undefined): boolean => {
  return num !== undefined && num > 0;
};

export const isNumber = (num: number | undefined): boolean => {
  return num !== undefined;
};

// Function to validate the request body for getInitialLoads endpoint
export const validateGetInitialLoads = (body: RequestBody): boolean => {
  return !isEmpty(body.currency);
};

// Function to validate the request body for putMovements endpoint
export const validatePutMovements = (body: RequestBody): boolean => {
  return (
    !isEmpty(body.movement_name) &&
    isNumber(body.movement_val) &&
    !isEmpty(body.movement_date) &&
    !isEmpty(body.movement_type) &&
    !isEmpty(body.movement_tag) &&
    !isEmpty(body.currency)
  );
};

// Function to validate the request body for updateMovements endpoint
export const validateUpdateMovements = (body: RequestBody): boolean => {
  return (
    isNumber(body.movement_val) &&
    !isEmpty(body.movement_date) &&
    !isEmpty(body.movement_type) &&
    !isEmpty(body.movement_tag) &&
    !isEmpty(body.id) &&
    !isEmpty(body.currency)
  );
};

// Function to validate the request body for deleteMovements endpoint
export const validateDeleteMovements = (body: RequestBody): boolean => {
  return !isEmpty(body.id);
};
