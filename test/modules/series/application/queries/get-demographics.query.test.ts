import {
  GetDemographicsQuery,
  GetDemographicsResponse,
} from '../../../../../src/modules/series/application/queries/get-demographics.query';

describe('GetDemographicsQuery', () => {
  it('should create a query with default cache key', () => {
    // Act
    const query = new GetDemographicsQuery();

    // Assert
    expect(query.cacheKey).toBe('series:demographics:all');
  });

  it('should have consistent cache key across instances', () => {
    // Arrange
    const query1 = new GetDemographicsQuery();
    const query2 = new GetDemographicsQuery();

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.cacheKey).toBe('series:demographics:all');
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const query = new GetDemographicsQuery();

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.cacheKey).toBe('series:demographics:all');

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should maintain consistent cache key format', () => {
    // Act
    const query = new GetDemographicsQuery();

    // Assert
    expect(query.cacheKey).toBe('series:demographics:all');
    expect(query.cacheKey).toMatch(/^series:demographics:all$/);
  });

  it('should be a singleton-like behavior for cache key', () => {
    // Create multiple instances
    const queries = Array.from({ length: 10 }, () => new GetDemographicsQuery());

    // All should have the same cache key
    queries.forEach((query) => {
      expect(query.cacheKey).toBe('series:demographics:all');
    });

    // All cache keys should be equal
    const cacheKeys = queries.map((q) => q.cacheKey);
    const uniqueCacheKeys = new Set(cacheKeys);
    expect(uniqueCacheKeys.size).toBe(1);
  });

  it('should be different from other query cache keys', () => {
    // Act
    const demographicsQuery = new GetDemographicsQuery();

    // Assert - should be different from other query types
    expect(demographicsQuery.cacheKey).toBe('series:demographics:all');
    expect(demographicsQuery.cacheKey).not.toBe('series:genres:all');
    expect(demographicsQuery.cacheKey).not.toBe('series:years:all');
    expect(demographicsQuery.cacheKey).not.toBe('series:1');
  });
});
