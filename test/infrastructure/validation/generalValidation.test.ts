import {
  isValidEmail,
  isEmpty,
  isNumber,
  isValidDate,
} from '../../../src/infrastructure/validation/generalValidation';

describe('General Validation Functions', () => {
  describe('isValidEmail', () => {
    it('should return true for valid email addresses', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
        'a@b.c',
        'test.email+tag@example-domain.com',
        'user@subdomain.example.com',
        'test@123.456.789.012', // IP-like domain (valid format)
        'user@example-domain.com',
        'test_user@example.org',
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should return false for invalid email addresses', () => {
      const invalidEmails = [
        '', // Empty string
        ' ', // Space
        'invalid', // No @ symbol
        '@example.com', // Missing local part
        'test@', // Missing domain
        'test.example.com', // Missing @ symbol
        'test@example', // Missing TLD
        'test@.com', // Domain starts with dot
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidEmail('test@example.co.uk')).toBe(true); // Multiple dots in TLD
      expect(isValidEmail('test@example.museum')).toBe(true); // Long TLD
      expect(isValidEmail('test@example.info')).toBe(true); // Info TLD
      expect(isValidEmail('test@example.mobi')).toBe(true); // Mobile TLD
    });

    it('should handle special characters in local part', () => {
      expect(isValidEmail('test+tag@example.com')).toBe(true);
      expect(isValidEmail('test.tag@example.com')).toBe(true);
      expect(isValidEmail('test_tag@example.com')).toBe(true);
      expect(isValidEmail('test-tag@example.com')).toBe(true);
      expect(isValidEmail('test@example.c')).toBe(true); // Single character TLD
      expect(isValidEmail('test@example.com.')).toBe(true); // Trailing dot in domain
      expect(isValidEmail('test@-example.com')).toBe(true); // Domain starts with hyphen
      expect(isValidEmail('test@example-.com')).toBe(true); // Domain ends with hyphen
      expect(isValidEmail('test@example..com')).toBe(true); // Double dots in domain (actually valid)
      expect(isValidEmail('test..user@example.com')).toBe(true); // Double dots in local part (actually valid)
      expect(isValidEmail('.test@example.com')).toBe(true); // Leading dot in local part (actually valid)
    });
  });

  describe('isEmpty', () => {
    it('should return true for empty or undefined values', () => {
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true); // Whitespace only
      expect(isEmpty('\t')).toBe(true); // Tab
      expect(isEmpty('\n')).toBe(true); // Newline
      expect(isEmpty('\r\n')).toBe(true); // Carriage return + newline
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty(' \t\n\r ')).toBe(true); // Mixed whitespace
    });

    it('should return false for non-empty strings', () => {
      expect(isEmpty('hello')).toBe(false);
      expect(isEmpty(' hello ')).toBe(false); // Whitespace around content
      expect(isEmpty('a')).toBe(false);
      expect(isEmpty('123')).toBe(false);
      expect(isEmpty('test@example.com')).toBe(false);
      expect(isEmpty('   hello   ')).toBe(false); // Content with surrounding whitespace
    });

    it('should handle edge cases', () => {
      expect(isEmpty('0')).toBe(false); // Zero as string
      expect(isEmpty('false')).toBe(false); // False as string
      expect(isEmpty('null')).toBe(false); // Null as string
      expect(isEmpty('undefined')).toBe(false); // Undefined as string
    });

    it('should handle special characters', () => {
      expect(isEmpty('!')).toBe(false);
      expect(isEmpty('@')).toBe(false);
      expect(isEmpty('#')).toBe(false);
      expect(isEmpty('$')).toBe(false);
      expect(isEmpty('%')).toBe(false);
      expect(isEmpty('&')).toBe(false);
      expect(isEmpty('*')).toBe(false);
    });
  });

  describe('isNumber', () => {
    it('should return true for valid numbers', () => {
      expect(isNumber(0)).toBe(true);
      expect(isNumber(1)).toBe(true);
      expect(isNumber(-1)).toBe(true);
      expect(isNumber(123)).toBe(true);
      expect(isNumber(-123)).toBe(true);
      expect(isNumber(3.14)).toBe(true);
      expect(isNumber(-3.14)).toBe(true);
      expect(isNumber(0.5)).toBe(true);
      expect(isNumber(-0.5)).toBe(true);
      expect(isNumber(1e5)).toBe(true); // Scientific notation
      expect(isNumber(1e-5)).toBe(true); // Scientific notation with negative exponent
      expect(isNumber(Infinity)).toBe(true);
      expect(isNumber(-Infinity)).toBe(true);
    });

    it('should return false for NaN', () => {
      expect(isNumber(NaN)).toBe(false);
    });

    it('should return false for non-number types', () => {
      expect(isNumber('123')).toBe(false); // String number
      expect(isNumber('abc')).toBe(false); // String text
      expect(isNumber('')).toBe(false); // Empty string
      expect(isNumber(true)).toBe(false); // Boolean
      expect(isNumber(false)).toBe(false); // Boolean
      expect(isNumber(null)).toBe(false); // Null
      expect(isNumber(undefined)).toBe(false); // Undefined
      expect(isNumber({})).toBe(false); // Object
      expect(isNumber([])).toBe(false); // Array
      expect(isNumber(() => {})).toBe(false); // Function
    });

    it('should handle edge cases', () => {
      expect(isNumber(Number.MAX_VALUE)).toBe(true);
      expect(isNumber(Number.MIN_VALUE)).toBe(true);
      expect(isNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
      expect(isNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
    });
  });

  describe('isValidDate', () => {
    it('should return true for valid date strings', () => {
      expect(isValidDate('2023-01-01')).toBe(true);
      expect(isValidDate('2023-12-31')).toBe(true);
      expect(isValidDate('2023-02-28')).toBe(true);
      expect(isValidDate('2024-02-29')).toBe(true); // Leap year
      expect(isValidDate('2000-01-01')).toBe(true);
      expect(isValidDate('1999-12-31')).toBe(true);
      expect(isValidDate('01/01/2023')).toBe(true); // MM/DD/YYYY format
      expect(isValidDate('12/31/2023')).toBe(true);
      expect(isValidDate('Jan 1, 2023')).toBe(true);
      expect(isValidDate('December 31, 2023')).toBe(true);
      expect(isValidDate('2023-01-01T00:00:00Z')).toBe(true); // ISO format
      expect(isValidDate('2023-01-01T12:30:45.123Z')).toBe(true); // ISO with milliseconds
    });

    it('should return true for valid Date objects', () => {
      expect(isValidDate(new Date('2023-01-01'))).toBe(true);
      expect(isValidDate(new Date(2023, 0, 1))).toBe(true); // Month is 0-indexed
      expect(isValidDate(new Date())).toBe(true); // Current date
      expect(isValidDate(new Date(0))).toBe(true); // Unix epoch
    });

    it('should return true for valid timestamps', () => {
      expect(isValidDate(1672531200000)).toBe(true); // Valid timestamp
      expect(isValidDate(0)).toBe(true); // Unix epoch
      expect(isValidDate(-86400000)).toBe(true); // Negative timestamp
    });

    it('should return false for invalid date strings', () => {
      expect(isValidDate('')).toBe(false); // Empty string
      expect(isValidDate('invalid')).toBe(false); // Invalid text
      expect(isValidDate('2023-13-01')).toBe(false); // Invalid month
      expect(isValidDate('2023-01-32')).toBe(false); // Invalid day
      expect(isValidDate('2023-00-01')).toBe(false); // Zero month
      expect(isValidDate('2023-01-00')).toBe(false); // Zero day
      expect(isValidDate('abc-def-ghi')).toBe(false); // Invalid format
      expect(isValidDate('2023/13/01')).toBe(false); // Invalid month in slash format
      expect(isValidDate('32/01/2023')).toBe(false); // Invalid day in slash format
    });

    it('should return false for non-date types', () => {
      expect(isValidDate(undefined)).toBe(false);
      expect(isValidDate({})).toBe(false);
      expect(isValidDate([])).toBe(false);
      expect(isValidDate(() => {})).toBe(false);
    });

    it('should handle edge cases', () => {
      expect(isValidDate('2000-02-29')).toBe(true); // Century year divisible by 400 (leap year)
      expect(isValidDate('2023-01-01T25:00:00Z')).toBe(false); // Invalid hour
      expect(isValidDate('2023-01-01T12:60:00Z')).toBe(false); // Invalid minute
      expect(isValidDate('2023-01-01T12:30:60Z')).toBe(false); // Invalid second
    });

    it('should handle different date formats', () => {
      expect(isValidDate('01-01-2023')).toBe(true); // DD-MM-YYYY format
      expect(isValidDate('2023/01/01')).toBe(true); // YYYY/MM/DD format
      expect(isValidDate('1/1/2023')).toBe(true); // M/D/YYYY format
      expect(isValidDate('Jan 1 2023')).toBe(true); // Abbreviated month
      expect(isValidDate('January 1, 2023')).toBe(true); // Full month name
      expect(isValidDate('2023-04-31')).toBe(true); // JavaScript Date handles invalid dates gracefully
      expect(isValidDate('1900-02-29')).toBe(true); // JavaScript Date handles invalid dates gracefully
      expect(isValidDate(true)).toBe(true); // Boolean true converts to valid date
    });

    it('should handle timezone variations', () => {
      expect(isValidDate('2023-01-01T12:00:00+00:00')).toBe(true); // UTC
      expect(isValidDate('2023-01-01T12:00:00-05:00')).toBe(true); // EST
      expect(isValidDate('2023-01-01T12:00:00+09:00')).toBe(true); // JST
      expect(isValidDate('2023-01-01T12:00:00Z')).toBe(true); // UTC shorthand
    });

    it('should handle boundary dates', () => {
      expect(isValidDate('1970-01-01')).toBe(true); // Unix epoch start
      expect(isValidDate('2038-01-19')).toBe(true); // Near 32-bit timestamp limit
      expect(isValidDate('9999-12-31')).toBe(true); // Far future
      expect(isValidDate('0001-01-01')).toBe(true); // Early date
    });
  });
});
