import {
  GetProductionYearsQuery,
  GetProductionYearsResponse,
} from '../../../../../src/modules/series/application/queries/get-production-years.query';

describe('GetProductionYearsQuery', () => {
  it('should create a query with default cache key', () => {
    // Act
    const query = new GetProductionYearsQuery();

    // Assert
    expect(query.cacheKey).toBe('series:years:all');
  });

  it('should have consistent cache key across instances', () => {
    // Arrange
    const query1 = new GetProductionYearsQuery();
    const query2 = new GetProductionYearsQuery();

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.cacheKey).toBe('series:years:all');
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const query = new GetProductionYearsQuery();

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.cacheKey).toBe('series:years:all');

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should maintain consistent cache key format', () => {
    // Act
    const query = new GetProductionYearsQuery();

    // Assert
    expect(query.cacheKey).toBe('series:years:all');
    expect(query.cacheKey).toMatch(/^series:years:all$/);
  });

  it('should be a singleton-like behavior for cache key', () => {
    // Create multiple instances
    const queries = Array.from({ length: 10 }, () => new GetProductionYearsQuery());

    // All should have the same cache key
    queries.forEach((query) => {
      expect(query.cacheKey).toBe('series:years:all');
    });

    // All cache keys should be equal
    const cacheKeys = queries.map((q) => q.cacheKey);
    const uniqueCacheKeys = new Set(cacheKeys);
    expect(uniqueCacheKeys.size).toBe(1);
  });

  it('should be different from other query cache keys', () => {
    // Act
    const yearsQuery = new GetProductionYearsQuery();

    // Assert - should be different from other query types
    expect(yearsQuery.cacheKey).toBe('series:years:all');
    expect(yearsQuery.cacheKey).not.toBe('series:genres:all');
    expect(yearsQuery.cacheKey).not.toBe('series:demographics:all');
    expect(yearsQuery.cacheKey).not.toBe('series:1');
  });
});
