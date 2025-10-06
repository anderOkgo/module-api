import { GetSeriesByIdQuery } from '../../../../../src/modules/series/application/queries/get-series-by-id.query';

describe('GetSeriesByIdQuery', () => {
  it('should create a query with a valid ID', () => {
    // Arrange
    const id = 123;

    // Act
    const query = new GetSeriesByIdQuery(id);

    // Assert
    expect(query.id).toBe(id);
    expect(query.cacheKey).toBe('series:123');
  });

  it('should generate correct cache key for different IDs', () => {
    // Test various ID values
    const testCases = [
      { id: 1, expectedCacheKey: 'series:1' },
      { id: 999, expectedCacheKey: 'series:999' },
      { id: 0, expectedCacheKey: 'series:0' },
      { id: -1, expectedCacheKey: 'series:-1' },
      { id: Number.MAX_SAFE_INTEGER, expectedCacheKey: `series:${Number.MAX_SAFE_INTEGER}` },
    ];

    testCases.forEach(({ id, expectedCacheKey }) => {
      // Act
      const query = new GetSeriesByIdQuery(id);

      // Assert
      expect(query.id).toBe(id);
      expect(query.cacheKey).toBe(expectedCacheKey);
    });
  });

  it('should handle edge case values', () => {
    // Test with zero ID
    const queryZero = new GetSeriesByIdQuery(0);
    expect(queryZero.id).toBe(0);
    expect(queryZero.cacheKey).toBe('series:0');

    // Test with negative ID
    const queryNegative = new GetSeriesByIdQuery(-1);
    expect(queryNegative.id).toBe(-1);
    expect(queryNegative.cacheKey).toBe('series:-1');

    // Test with maximum safe integer ID
    const queryMax = new GetSeriesByIdQuery(Number.MAX_SAFE_INTEGER);
    expect(queryMax.id).toBe(Number.MAX_SAFE_INTEGER);
    expect(queryMax.cacheKey).toBe(`series:${Number.MAX_SAFE_INTEGER}`);
  });

  it('should handle different numeric types', () => {
    // Test with different numeric values
    const testCases = [
      { id: 1, expected: 1 },
      { id: 999, expected: 999 },
      { id: 0.5, expected: 0.5 },
      { id: -999, expected: -999 },
    ];

    testCases.forEach(({ id, expected }) => {
      const query = new GetSeriesByIdQuery(id);
      expect(query.id).toBe(expected);
      expect(query.cacheKey).toBe(`series:${expected}`);
    });
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const query = new GetSeriesByIdQuery(123);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.id).toBe(123);
    expect(query.cacheKey).toBe('series:123');

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique cache keys for different IDs', () => {
    // Arrange
    const query1 = new GetSeriesByIdQuery(1);
    const query2 = new GetSeriesByIdQuery(2);
    const query3 = new GetSeriesByIdQuery(999);

    // Assert
    expect(query1.cacheKey).not.toBe(query2.cacheKey);
    expect(query1.cacheKey).not.toBe(query3.cacheKey);
    expect(query2.cacheKey).not.toBe(query3.cacheKey);
  });

  it('should maintain consistent cache key for same ID', () => {
    // Arrange
    const query1 = new GetSeriesByIdQuery(123);
    const query2 = new GetSeriesByIdQuery(123);

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.id).toBe(query2.id);
  });

  it('should handle large ID values', () => {
    // Test with large numbers
    const largeId = 999999999;
    const query = new GetSeriesByIdQuery(largeId);

    expect(query.id).toBe(largeId);
    expect(query.cacheKey).toBe(`series:${largeId}`);
  });

  it('should handle fractional ID values', () => {
    // Test with decimal numbers
    const fractionalId = 123.456;
    const query = new GetSeriesByIdQuery(fractionalId);

    expect(query.id).toBe(fractionalId);
    expect(query.cacheKey).toBe(`series:${fractionalId}`);
  });

  it('should maintain cache key format consistency', () => {
    // Test that all cache keys follow the same format
    const testIds = [1, 10, 100, 1000, -1, 0, 0.5];

    testIds.forEach((id) => {
      const query = new GetSeriesByIdQuery(id);
      expect(query.cacheKey).toBe(`series:${id}`);
      expect(query.cacheKey).toMatch(/^series:-?\d+(\.\d+)?$/);
    });
  });
});
