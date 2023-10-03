import { HDB } from '../../../../src/helpers/my.database.helper';

describe('MySQL Helper Functions', () => {
  describe('generateInCondition', () => {
    it('should generate the IN condition', () => {
      const label = 'column';
      const values = 'value1, value2, value3';
      const result = HDB.generateInCondition(label, values);

      expect(result).toEqual(` AND ${label} IN (${values})`);
    });
  });

  describe('generateLikeCondition', () => {
    it('should generate the LIKE condition', () => {
      const label = 'column';
      const value = 'searchValue';
      const result = HDB.generateLikeCondition(label, value);

      expect(result).toEqual(` AND ${label} LIKE "%${value}%"`);
    });
  });

  describe('generateEqualCondition', () => {
    it('should generate the EQUAL condition', () => {
      const label = 'column';
      const value = 'exactValue';
      const result = HDB.generateEqualCondition(label, value);

      expect(result).toEqual(` AND ${label} = "${value}"`);
    });
  });

  describe('generateLimit', () => {
    it('should generate the LIMIT condition', () => {
      const label = 'limit';
      const value = '10';
      const result = HDB.generateLimit(label, value);

      expect(result).toEqual(` ${label} ${value}`);
    });
  });

  describe('generateBetweenCondition', () => {
    it('should generate the BETWEEN condition for an array with two values', () => {
      const label = 'column';
      const values = [5, 10];
      const result = HDB.generateBetweenCondition(label, values);

      expect(result).toEqual(` AND ${label} BETWEEN ${values[0]} and ${values[1]}`);
    });

    it('should return an empty string for an array with less than two values', () => {
      const label = 'column';
      const values = [5];
      const result = HDB.generateBetweenCondition(label, values);

      expect(result).toEqual('');
    });
  });

  describe('generateAndCondition', () => {
    it('should generate the AND condition for an array of values', () => {
      const label = 'column';
      const values = [1, 2, 3];
      const result = HDB.generateAndCondition(label, values);

      const expected = values.map((e) => ` AND ${label} LIKE "%${e}%"`).join('');
      expect(result).toEqual(expected);
    });

    it('should return an empty string for an empty array', () => {
      const label = 'column';
      const values: number[] = [];
      const result = HDB.generateAndCondition(label, values);

      expect(result).toEqual('');
    });
  });
});
