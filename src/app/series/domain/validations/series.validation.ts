import Production from '../models/Series';

function validate_id(id: string): boolean {
  if (!id || id.length !== 10) {
    return false;
  }

  return true;
}

function validate_production_name(production_name: string): boolean {
  if (!production_name || production_name.length < 1 || production_name.length > 100) {
    return false;
  }

  return true;
}

function validate_production_number_chapters(production_number_chapters: string): boolean {
  if (
    !production_number_chapters ||
    !Number.isInteger(production_number_chapters) ||
    parseInt(production_number_chapters) < 1
  ) {
    return false;
  }

  return true;
}

function validate_production_description(production_description: string): boolean {
  if (!production_description || production_description.length < 1 || production_description.length > 1000) {
    return false;
  }

  return true;
}

function validate_production_year(production_year: string): boolean {
  if (
    !production_year ||
    !Number.isInteger(production_year) ||
    parseInt(production_year) < 1900 ||
    parseInt(production_year) > 2023
  ) {
    return false;
  }

  return true;
}

function validate_demographic_name(demographic_name: string): boolean {
  if (!demographic_name || demographic_name.length < 1 || demographic_name.length > 100) {
    return false;
  }

  return true;
}

function validate_genre_names(genre_names: string): boolean {
  if (!genre_names) {
    return true;
  } else {
    false;
  }

  const genre_names_array = genre_names.split(',');

  for (const genre_name of genre_names_array) {
    if (!genre_name || genre_name.length < 1 || genre_name.length > 100) {
      return false;
    }
  }

  return true;
}

function validate_limit(limit: string): boolean {
  if (!limit || !Number.isInteger(limit) || parseInt(limit) < 1) {
    return false;
  }

  return true;
}

function validateProduction(production: Production): boolean {
  return (
    validate_id(production.id) &&
    validate_production_name(production.production_name) &&
    validate_production_number_chapters(production.production_number_chapters) &&
    validate_production_description(production.production_description) &&
    validate_production_year(production.production_year) &&
    validate_demographic_name(production.demographic_name) &&
    validate_genre_names(production.genre_names) &&
    validate_limit(production.limit)
  );
}

export default validateProduction;
