import {
  GetGenresQuery,
  GetGenresResponse,
} from '../../../../../src/modules/series/application/queries/get-genres.query';

describe('GetGenresQuery', () => {
  it('should create a query with default cache key', () => {
    // Act
    const query = new GetGenresQuery();

    // Assert
    expect(query.cacheKey).toBe('series:genres:all');
  });

  it('should have consistent cache key across instances', () => {
    // Arrange
    const query1 = new GetGenresQuery();
    const query2 = new GetGenresQuery();

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.cacheKey).toBe('series:genres:all');
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const query = new GetGenresQuery();

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.cacheKey).toBe('series:genres:all');

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should maintain consistent cache key format', () => {
    // Act
    const query = new GetGenresQuery();

    // Assert
    expect(query.cacheKey).toBe('series:genres:all');
    expect(query.cacheKey).toMatch(/^series:genres:all$/);
  });

  it('should be a singleton-like behavior for cache key', () => {
    // Create multiple instances
    const queries = Array.from({ length: 10 }, () => new GetGenresQuery());

    // All should have the same cache key
    queries.forEach((query) => {
      expect(query.cacheKey).toBe('series:genres:all');
    });

    // All cache keys should be equal
    const cacheKeys = queries.map((q) => q.cacheKey);
    const uniqueCacheKeys = new Set(cacheKeys);
    expect(uniqueCacheKeys.size).toBe(1);
  });
});
