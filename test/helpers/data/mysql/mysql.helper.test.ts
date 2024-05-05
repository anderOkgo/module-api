import {
  generateInCondition,
  generateLikeCondition,
  generateEqualCondition,
  generateLimit,
  generateBetweenCondition,
  generateAndCondition,
} from '../../../../src/helpers/data/mysql/mysql.helper';

describe('MySQL Helper Functions', () => {
  describe('generateInCondition', () => {
    it('should generate the IN condition', () => {
      const label = 'column';
      const values = ['value1', 'value2', 'value3'];
      const result = generateInCondition(label, values);

      expect(result).toEqual(` AND ${label} IN (?, ?, ?)`);
    });
  });

  describe('generateLikeCondition', () => {
    it('should generate the LIKE condition', () => {
      const label = 'column';
      const value = 'searchValue';
      const result = generateLikeCondition(label);

      expect(result).toEqual(` AND ${label} LIKE CONCAT('%', ?, '%')`);
    });
  });

  describe('generateEqualCondition', () => {
    it('should generate the EQUAL condition', () => {
      const label = 'column';
      const result = generateEqualCondition(label);

      expect(result).toEqual(` AND ${label} = ?`);
    });
  });

  describe('generateLimit', () => {
    it('should generate the LIMIT condition', () => {
      const result = generateLimit();

      expect(result).toEqual(` LIMIT ?`);
    });
  });

  describe('generateBetweenCondition', () => {
    it('should generate the BETWEEN condition for an array with two values', () => {
      const label = 'column';
      const values = [5, 10];
      const result = generateBetweenCondition(label, values);

      expect(result).toEqual(` AND ${label} BETWEEN ? and ?`);
    });

    it('should return an empty string for an array with less than two values', () => {
      const label = 'column';
      const values = [5];
      const result = generateBetweenCondition(label, values);

      expect(result).toEqual(` AND ${label} = ?`);
    });
  });

  describe('generateAndCondition', () => {
    it('should generate the AND condition for an array of values', () => {
      const label = 'column';
      const values = [1, 2, 3];
      const result = generateAndCondition(label, values);

      const expected = values.map(() => ` AND ${label} LIKE CONCAT('%', ?, '%')`).join('');
      expect(result).toEqual(expected);
    });

    it('should return an empty string for an empty array', () => {
      const label = 'column';
      const values: number[] = [];
      const result = generateAndCondition(label, values);

      expect(result).toEqual('');
    });
  });
});
