import { validateProduction } from '../../../../../src/modules/series/application/series.validation';

describe('validateProduction', () => {
  it('should return valid result when input is valid', () => {
    const input = {
      id: '1,2,3',
      production_name: 'Example Production',
      production_number_chapters: '10,20,30',
      production_description: 'This is a valid description',
      production_year: '2000,2005,2010',
      demographic_name: 'Demographic',
      genre_names: 'Action,Adventure',
      limit: 100,
    };

    const result = validateProduction(input);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual(undefined);
    expect(result.result).toEqual({
      id: [1, 2, 3],
      production_name: 'Example Production',
      production_number_chapters: [10, 20, 30],
      production_description: 'This is a valid description',
      production_year: [2000, 2005, 2010],
      demographic_name: 'Demographic',
      genre_names: ['Action', 'Adventure'],
      limit: 100,
    });
  });

  it('should return invalid result when input is invalid', () => {
    const input = {
      id: '1,invalid,3',
      production_name: 'Example Production',
      production_number_chapters: '10,20,30',
      production_description: 'This is a valid description',
      production_year: '2000,invalid,2010',
      demographic_name: 'Demographic',
      genre_names: 'Action,Adventure',
      limit: 11000, // Exceeds the limit
    };

    const result = validateProduction(input);

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual({
      id: 'ID must contain valid numbers separated by commas.',
      production_year: 'Production years must contain valid numbers separated by commas.',
      limit: 'Limit cannot exceed 10,000.',
    });
    expect(result.result).toEqual({
      demographic_name: 'Demographic',
      genre_names: ['Action', 'Adventure'],
      id: '1,invalid,3',
      limit: 11000,
      production_description: 'This is a valid description',
      production_name: 'Example Production',
      production_number_chapters: [10, 20, 30],
      production_year: '2000,invalid,2010',
    });
  });
});
