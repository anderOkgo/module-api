export interface ValidateProduction {
  [key: string]: string | null;
}

export type ValidationResult =
  | {
      result: any;
      valid: false;
      errors: ValidateProduction;
    }
  | {
      result: any;
      valid: true;
      errors?: ValidateProduction; // Include 'errors' even when 'valid' is true
    };
