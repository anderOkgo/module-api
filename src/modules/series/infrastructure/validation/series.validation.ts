// Types for validation
export interface ValidateProduction {
  id?: string;
  production_name?: string;
  production_number_chapters?: string;
  production_description?: string;
  production_year?: string;
  demographic_name?: string;
  genre_names?: string;
  limit?: string;
}

export interface ValidationResult {
  result: any;
  valid: boolean;
  errors?: ValidateProduction;
}

export const validateProduction = (input: any): ValidationResult => {
  const errors: ValidateProduction = {};

  // Create a copy of the input object
  const result = { ...input };

  // Validate and clean 'id'
  if (typeof result.id === 'string') {
    const idValues = result.id.split(',').map((value: string) => parseInt(value.trim()));
    if (idValues.some((value: number) => isNaN(value))) {
      errors.id = 'ID must contain valid numbers separated by commas.';
    } else {
      result.id = idValues;
    }
  } else {
    delete result.id;
  }

  // Validate 'production_name'
  if (result.production_name) {
    if (typeof result.production_name !== 'string' || result.production_name.length > 50) {
      errors.production_name = 'Production name must be a string with a maximum length of 50 characters.';
    }
  } else {
    delete result.production_name;
  }

  // Validate 'production_number_chapters'
  if (typeof result.production_number_chapters === 'string') {
    const chapterValues = result.production_number_chapters
      .split(',')
      .map((value: string) => parseInt(value.trim()));
    if (chapterValues.some((value: number) => isNaN(value))) {
      errors.production_number_chapters = 'Production chapters must contain valid numbers separated by commas.';
    } else {
      if (chapterValues.length === 2 && chapterValues[0] > chapterValues[1]) {
        errors.production_number_chapters = 'The first chapter number cannot be higher than the second one.';
      } else {
        result.production_number_chapters = chapterValues;
      }
    }
  } else {
    delete result.production_number_chapters;
  }

  // Validate 'production_description'
  if (result.production_description) {
    if (typeof result.production_description !== 'string' || result.production_description.length > 50) {
      errors.production_description =
        'Production description must be a string with a maximum length of 50 characters.';
    }
  } else {
    delete result.production_description;
  }

  // Validate 'production_year'
  if (typeof result.production_year === 'string') {
    const yearValues = result.production_year.split(',').map((value: string) => parseInt(value.trim()));
    if (yearValues.some((value: number) => isNaN(value))) {
      errors.production_year = 'Production years must contain valid numbers separated by commas.';
    } else {
      if (yearValues.length === 2 && yearValues[0] > yearValues[1]) {
        errors.production_year = 'The first year cannot be higher than the second one.';
      } else {
        result.production_year = yearValues;
      }
    }
  } else {
    delete result.production_year;
  }

  // Validate 'demographic_name'
  if (result.demographic_name) {
    if (typeof result.demographic_name !== 'string' || result.demographic_name.length > 50) {
      errors.demographic_name = 'Demographic name must be a string with a maximum length of 50 characters.';
    }
  } else {
    delete result.demographic_name;
  }

  // Validate 'genre_names'
  if (typeof result.genre_names === 'string') {
    const genreValues = result.genre_names.split(',').map((value: string) => value.trim());
    if (!genreValues.some((value: string) => typeof value === 'string' && value.length <= 50)) {
      errors.genre_names =
        'Genre names must be strings with a maximum length of 50 characters separated by commas.';
    } else {
      result.genre_names = genreValues;
    }
  } else {
    delete result.genre_names;
  }

  // Validate and convert 'limit' to number
  if (result.limit !== undefined) {
    const limitValue = parseInt(result.limit);
    if (isNaN(limitValue) || limitValue < 1) {
      errors.limit = 'Limit must be a positive number.';
    } else if (limitValue > 10000) {
      errors.limit = 'Limit cannot exceed 10,000.';
    } else {
      result.limit = limitValue;
    }
  } else {
    result.limit = 10000; // Default limit
  }

  return Object.keys(errors).length > 0 ? { result, valid: false, errors } : { result, valid: true };
};
