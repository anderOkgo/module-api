import Year from '../../../../../src/modules/series/domain/entities/year.entity';

describe('Year Entity', () => {
  describe('Year interface', () => {
    it('should have years property as string', () => {
      const year: Year = {
        years: '2023',
      };

      expect(year.years).toBe('2023');
      expect(typeof year.years).toBe('string');
    });

    it('should handle different year formats', () => {
      const year1: Year = {
        years: '2023',
      };

      const year2: Year = {
        years: '2024',
      };

      const year3: Year = {
        years: '1999',
      };

      expect(year1.years).toBe('2023');
      expect(year2.years).toBe('2024');
      expect(year3.years).toBe('1999');
    });

    it('should handle empty string', () => {
      const year: Year = {
        years: '',
      };

      expect(year.years).toBe('');
    });
  });

  describe('Edge cases', () => {
    it('should handle non-numeric year strings', () => {
      const year: Year = {
        years: 'not-a-year',
      };

      expect(year.years).toBe('not-a-year');
    });

    it('should handle very long year strings', () => {
      const year: Year = {
        years: '2023202420252026',
      };

      expect(year.years).toBe('2023202420252026');
    });

    it('should handle special characters in year string', () => {
      const year: Year = {
        years: '2023-2024',
      };

      expect(year.years).toBe('2023-2024');
    });

    it('should handle unicode characters', () => {
      const year: Year = {
        years: '２０２３', // Full-width numbers
      };

      expect(year.years).toBe('２０２３');
    });
  });
});
