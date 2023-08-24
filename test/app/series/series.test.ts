// test.ts

import Production from '../../../src/app/series/domain/models/Series';
import validateProduction from '../../../src/app/series/domain/validations/series.validation';

describe('validateProduction', () => {
  it('should return true for a valid Production object', () => {
    const production: Production = {
      id: '1234567890',
      production_name: 'The Mandalorian',
      production_number_chapters: '8',
      production_description: 'A Star Wars story.',
      production_year: '2019',
      demographic_name: 'Action',
      genre_names: 'Sci-Fi, Western',
      limit: '10',
    };

    const result = validateProduction(production);

    expect(result).toBe(true);
  });

  it('should return false for an invalid Production object', () => {
    const production: Production = {
      id: '',
      production_name: '',
      production_number_chapters: '8',
      production_description: 'A Star Wars story.',
      production_year: '2019',
      demographic_name: 'Action',
      genre_names: 'Sci-Fi, Western',
      limit: '10',
    };

    const result = validateProduction(production);

    expect(result).toBe(false);
  });
});
