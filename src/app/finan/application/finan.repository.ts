export interface RequestBody {
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
