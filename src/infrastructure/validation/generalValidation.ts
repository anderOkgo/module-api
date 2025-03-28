export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validation function to check if a string is empty or undefined
export const isEmpty = (str: string | undefined): boolean => {
  return !str || (typeof str === 'string' && str.trim().length === 0);
};

// Validation function to check if a value is a number
export const isNumber = (value: any): boolean => {
  return typeof value === 'number' && !isNaN(value);
};

export const isValidDate = (dateString: any) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
