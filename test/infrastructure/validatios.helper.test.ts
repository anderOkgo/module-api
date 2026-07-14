import { isValidEmail, isEmpty, isNumber, isValidDate } from '../../src/infrastructure/validatios.helper';

// This barrel file (src/infrastructure/validatios.helper.ts) is always mocked in the
// tests that consume it (finan persistence/validation tests), so it never gets loaded
// unmocked elsewhere. This test exercises the real re-export.
describe('validatios.helper barrel', () => {
  it('should re-export the real generalValidation functions', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isNumber(5)).toBe(true);
    expect(isValidDate('2023-01-01')).toBe(true);
  });
});
