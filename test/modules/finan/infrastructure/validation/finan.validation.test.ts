import {
  isPositiveNumber,
  validateGetInitialLoad,
  validateInitialLoad,
  validatePutMovement,
  validateUpdateMovements,
  RequestBody,
  ValidationResult,
} from '../../../../../src/modules/finan/infrastructure/validation/finan.validation';

// Mock the helper functions
jest.mock('../../../../../src/infrastructure/validatios.helper', () => ({
  isEmpty: jest.fn((value) => value === null || value === undefined || value === ''),
  isNumber: jest.fn((value) => typeof value === 'number' && !isNaN(value)),
  isValidDate: jest.fn((value) => {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return date instanceof Date && !isNaN(date.getTime());
  }),
}));

describe('FinanValidation', () => {
  const validBody: RequestBody = {
    movement_name: 'Test Movement',
    movement_val: 100.5,
    movement_date: '2023-01-01',
    movement_type: 1,
    movement_tag: 'test-tag',
    currency: 'USD',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isPositiveNumber', () => {
    it('should return true for positive numbers', () => {
      expect(isPositiveNumber(1)).toBe(true);
      expect(isPositiveNumber(100.5)).toBe(true);
      expect(isPositiveNumber(0.01)).toBe(true);
    });

    it('should return false for zero', () => {
      expect(isPositiveNumber(0)).toBe(false);
    });

    it('should return false for negative numbers', () => {
      expect(isPositiveNumber(-1)).toBe(false);
      expect(isPositiveNumber(-100.5)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isPositiveNumber(undefined)).toBe(false);
    });
  });

  describe('validateGetInitialLoad', () => {
    it('should pass validation with valid currency', () => {
      const body: RequestBody = {
        currency: 'USD',
      };

      const result = validateGetInitialLoad(body);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation with empty currency', () => {
      const body: RequestBody = {
        currency: '',
      };

      const result = validateGetInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency cannot be empty');
    });

    it('should fail validation with null currency', () => {
      const body: RequestBody = {
        currency: null,
      };

      const result = validateGetInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency cannot be empty');
    });

    it('should fail validation with undefined currency', () => {
      const body: RequestBody = {
        currency: undefined,
      };

      const result = validateGetInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency cannot be empty');
    });

    it('should fail validation with invalid currency length', () => {
      const body: RequestBody = {
        currency: 'US',
      };

      const result = validateGetInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency must be a 3-character code');
    });

    it('should fail validation with too long currency', () => {
      const body: RequestBody = {
        currency: 'USDD',
      };

      const result = validateGetInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency must be a 3-character code');
    });

    it('should pass validation with valid currencies', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'CAD', 'JPY'];

      validCurrencies.forEach((currency) => {
        const body: RequestBody = { currency };
        const result = validateGetInitialLoad(body);
        expect(result.error).toBe(false);
        expect(result.errors).toEqual([]);
      });
    });
  });

  describe('validateInitialLoad', () => {
    it('should pass validation with valid data', () => {
      const body: RequestBody = {
        currency: 'USD',
        start_date: '2023-01-01',
        end_date: '2023-12-31',
      };

      const result = validateInitialLoad(body);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation with invalid start_date', () => {
      const body: RequestBody = {
        currency: 'USD',
        start_date: 'invalid-date',
      };

      const result = validateInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Start date is invalid');
    });

    it('should fail validation with invalid end_date', () => {
      const body: RequestBody = {
        currency: 'USD',
        end_date: 'invalid-date',
      };

      const result = validateInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('End date is invalid');
    });

    it('should fail validation with non-string currency', () => {
      const body: RequestBody = {
        currency: 123,
      };

      const result = validateInitialLoad(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency must be a string');
    });

    it('should pass validation with valid dates', () => {
      const validDates = ['2023-01-01', '2023-12-31', '2024-02-29'];

      validDates.forEach((date) => {
        const body: RequestBody = {
          currency: 'USD',
          start_date: date,
          end_date: date,
        };
        const result = validateInitialLoad(body);
        expect(result.error).toBe(false);
      });
    });

    it('should handle missing optional fields', () => {
      const body: RequestBody = {
        currency: 'USD',
      };

      const result = validateInitialLoad(body);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validatePutMovement', () => {
    it('should pass validation with valid data', () => {
      const result = validatePutMovement(validBody);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation with empty movement_name', () => {
      const body: RequestBody = {
        ...validBody,
        movement_name: '',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement name cannot be empty');
    });

    it('should fail validation with too long movement_name', () => {
      const body: RequestBody = {
        ...validBody,
        movement_name: 'a'.repeat(101),
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement name exceeds 100 characters');
    });

    it('should fail validation with non-number movement_val', () => {
      const body: RequestBody = {
        ...validBody,
        movement_val: 'not-a-number',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement value must be a number');
    });

    it('should fail validation with negative movement_val', () => {
      const body: RequestBody = {
        ...validBody,
        movement_val: -100,
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement value must be positive');
    });

    it('should fail validation with zero movement_val', () => {
      const body: RequestBody = {
        ...validBody,
        movement_val: 0,
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement value must be positive');
    });

    it('should fail validation with too large movement_val', () => {
      const body: RequestBody = {
        ...validBody,
        movement_val: 1e17,
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Value exceeds 16 characters');
    });

    it('should fail validation with empty movement_date', () => {
      const body: RequestBody = {
        ...validBody,
        movement_date: '',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement date cannot be empty');
    });

    it('should fail validation with invalid movement_date', () => {
      const body: RequestBody = {
        ...validBody,
        movement_date: 'invalid-date',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement date is invalid');
    });

    it('should fail validation with empty movement_type', () => {
      const body: RequestBody = {
        ...validBody,
        movement_type: '',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement type cannot be empty');
    });

    it('should fail validation with non-number movement_type', () => {
      const body: RequestBody = {
        ...validBody,
        movement_type: 'not-a-number',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement type must be a number');
    });

    it('should fail validation with empty movement_tag', () => {
      const body: RequestBody = {
        ...validBody,
        movement_tag: '',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement tag cannot be empty');
    });

    it('should fail validation with too long movement_tag', () => {
      const body: RequestBody = {
        ...validBody,
        movement_tag: 'a'.repeat(61),
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement tag exceeds 60 characters');
    });

    it('should fail validation with empty currency', () => {
      const body: RequestBody = {
        ...validBody,
        currency: '',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency cannot be empty');
    });

    it('should fail validation with invalid currency length', () => {
      const body: RequestBody = {
        ...validBody,
        currency: 'US',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Currency must be a 3-character code');
    });

    it('should handle multiple validation errors', () => {
      const body: RequestBody = {
        movement_name: '',
        movement_val: -100,
        movement_date: 'invalid-date',
        movement_type: 'not-a-number',
        movement_tag: '',
        currency: 'US',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement name cannot be empty');
      expect(result.errors).toContain('Movement value must be positive');
      expect(result.errors).toContain('Movement date is invalid');
      expect(result.errors).toContain('Movement type must be a number');
      expect(result.errors).toContain('Movement tag cannot be empty');
      expect(result.errors).toContain('Currency must be a 3-character code');
    });

    it('should handle string movement_type that can be parsed as number', () => {
      const body: RequestBody = {
        ...validBody,
        movement_type: '1',
      };

      const result = validatePutMovement(body);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });
  });

  describe('validateUpdateMovements', () => {
    const validBody: RequestBody = {
      id: 1,
      movement_name: 'Updated Movement',
      movement_val: 200.75,
      movement_date: '2023-02-01',
      movement_type: 2,
      movement_tag: 'updated-tag',
      currency: 'EUR',
    };

    it('should pass validation with valid data', () => {
      const result = validateUpdateMovements(validBody, 1);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should pass validation with zero id (current implementation allows it)', () => {
      const result = validateUpdateMovements(validBody, 0);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should pass validation with negative id (current implementation allows it)', () => {
      const result = validateUpdateMovements(validBody, -1);

      expect(result.error).toBe(false);
      expect(result.errors).toEqual([]);
    });

    it('should fail validation with non-number id', () => {
      const result = validateUpdateMovements(validBody, 'invalid-id');

      expect(result.error).toBe(true);
      expect(result.errors).toContain('ID is invalid');
    });

    it('should inherit validation errors from put movement', () => {
      const body: RequestBody = {
        id: 1,
        movement_name: '',
        movement_val: -100,
        movement_date: 'invalid-date',
        movement_type: 'not-a-number',
        movement_tag: '',
        currency: 'US',
      };

      const result = validateUpdateMovements(body, 1);

      expect(result.error).toBe(true);
      expect(result.errors).toContain('Movement name cannot be empty');
      expect(result.errors).toContain('Movement value must be positive');
      expect(result.errors).toContain('Movement date is invalid');
      expect(result.errors).toContain('Movement type must be a number');
      expect(result.errors).toContain('Movement tag cannot be empty');
      expect(result.errors).toContain('Currency must be a 3-character code');
    });
  });

  describe('Edge cases', () => {
    it('should handle null and undefined values', () => {
      const body: RequestBody = {
        currency: null,
        movement_name: undefined,
        movement_val: null,
        movement_date: undefined,
        movement_type: null,
        movement_tag: undefined,
      };

      const getInitialResult = validateGetInitialLoad(body);
      const putResult = validatePutMovement(body);

      expect(getInitialResult.error).toBe(true);
      expect(putResult.error).toBe(true);
    });

    it('should handle edge case currency lengths', () => {
      const currencies = ['', 'A', 'AB', 'ABCD', 'ABCDE'];
      const expectedErrors = [
        'Currency cannot be empty',
        'Currency must be a 3-character code',
        'Currency must be a 3-character code',
        'Currency must be a 3-character code',
        'Currency must be a 3-character code',
      ];

      currencies.forEach((currency, index) => {
        const body: RequestBody = { currency };
        const result = validateGetInitialLoad(body);
        expect(result.error).toBe(true);
        expect(result.errors).toContain(expectedErrors[index]);
      });
    });

    it('should handle edge case movement name lengths', () => {
      const names = ['', 'a', 'a'.repeat(100), 'a'.repeat(101)];

      names.forEach((name, index) => {
        const body: RequestBody = {
          ...validBody,
          movement_name: name,
        };
        const result = validatePutMovement(body);

        if (index === 0) {
          expect(result.error).toBe(true);
          expect(result.errors).toContain('Movement name cannot be empty');
        } else if (index === 1) {
          expect(result.error).toBe(false);
        } else if (index === 2) {
          expect(result.error).toBe(false);
        } else if (index === 3) {
          expect(result.error).toBe(true);
          expect(result.errors).toContain('Movement name exceeds 100 characters');
        }
      });
    });

    it('should handle edge case movement tag lengths', () => {
      const tags = ['', 'a', 'a'.repeat(60), 'a'.repeat(61)];

      tags.forEach((tag, index) => {
        const body: RequestBody = {
          ...validBody,
          movement_tag: tag,
        };
        const result = validatePutMovement(body);

        if (index === 0) {
          expect(result.error).toBe(true);
          expect(result.errors).toContain('Movement tag cannot be empty');
        } else if (index === 1) {
          expect(result.error).toBe(false);
        } else if (index === 2) {
          expect(result.error).toBe(false);
        } else if (index === 3) {
          expect(result.error).toBe(true);
          expect(result.errors).toContain('Movement tag exceeds 60 characters');
        }
      });
    });

    it('should handle edge case movement values', () => {
      const values = [0, -0.01, 0.01, 1e16, 1e17];

      values.forEach((value, index) => {
        const body: RequestBody = {
          ...validBody,
          movement_val: value,
        };
        const result = validatePutMovement(body);

        if (index === 0 || index === 1) {
          expect(result.error).toBe(true);
          expect(result.errors).toContain('Movement value must be positive');
        } else if (index === 2 || index === 3) {
          expect(result.error).toBe(false);
        } else if (index === 4) {
          expect(result.error).toBe(true);
          expect(result.errors).toContain('Value exceeds 16 characters');
        }
      });
    });
  });
});
