import {
  GetAllSeriesQuery,
  GetAllSeriesResponse,
} from '../../../../../src/modules/series/application/queries/get-all-series.query';

describe('GetAllSeriesQuery', () => {
  it('should create a query with default parameters', () => {
    // Act
    const query = new GetAllSeriesQuery();

    // Assert
    expect(query.limit).toBe(50);
    expect(query.offset).toBe(0);
    expect(query.cacheKey).toBe('series:all:50:0');
  });

  it('should create a query with custom parameters', () => {
    // Arrange
    const limit = 20;
    const offset = 40;

    // Act
    const query = new GetAllSeriesQuery(limit, offset);

    // Assert
    expect(query.limit).toBe(20);
    expect(query.offset).toBe(40);
    expect(query.cacheKey).toBe('series:all:20:40');
  });

  it('should generate correct cache key for different parameters', () => {
    // Test various combinations
    const testCases = [
      { limit: 10, offset: 0, expectedCacheKey: 'series:all:10:0' },
      { limit: 25, offset: 50, expectedCacheKey: 'series:all:25:50' },
      { limit: 100, offset: 200, expectedCacheKey: 'series:all:100:200' },
      { limit: 0, offset: 0, expectedCacheKey: 'series:all:0:0' },
      { limit: 1, offset: 999, expectedCacheKey: 'series:all:1:999' },
    ];

    testCases.forEach(({ limit, offset, expectedCacheKey }) => {
      // Act
      const query = new GetAllSeriesQuery(limit, offset);

      // Assert
      expect(query.limit).toBe(limit);
      expect(query.offset).toBe(offset);
      expect(query.cacheKey).toBe(expectedCacheKey);
    });
  });

  it('should handle edge case values', () => {
    // Test with zero values
    const queryZero = new GetAllSeriesQuery(0, 0);
    expect(queryZero.limit).toBe(0);
    expect(queryZero.offset).toBe(0);
    expect(queryZero.cacheKey).toBe('series:all:0:0');

    // Test with maximum safe integers
    const queryMax = new GetAllSeriesQuery(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    expect(queryMax.limit).toBe(Number.MAX_SAFE_INTEGER);
    expect(queryMax.offset).toBe(Number.MAX_SAFE_INTEGER);
    expect(queryMax.cacheKey).toBe(`series:all:${Number.MAX_SAFE_INTEGER}:${Number.MAX_SAFE_INTEGER}`);
  });

  it('should handle negative values', () => {
    // Act
    const query = new GetAllSeriesQuery(-10, -5);

    // Assert
    expect(query.limit).toBe(-10);
    expect(query.offset).toBe(-5);
    expect(query.cacheKey).toBe('series:all:-10:-5');
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const query = new GetAllSeriesQuery(20, 10);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.limit).toBe(20);
    expect(query.offset).toBe(10);
    expect(query.cacheKey).toBe('series:all:20:10');

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique cache keys for different instances', () => {
    // Arrange
    const query1 = new GetAllSeriesQuery(10, 0);
    const query2 = new GetAllSeriesQuery(20, 0);
    const query3 = new GetAllSeriesQuery(10, 10);

    // Assert
    expect(query1.cacheKey).not.toBe(query2.cacheKey);
    expect(query1.cacheKey).not.toBe(query3.cacheKey);
    expect(query2.cacheKey).not.toBe(query3.cacheKey);
  });

  it('should maintain consistent cache key for same parameters', () => {
    // Arrange
    const query1 = new GetAllSeriesQuery(25, 50);
    const query2 = new GetAllSeriesQuery(25, 50);

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.limit).toBe(query2.limit);
    expect(query1.offset).toBe(query2.offset);
  });
});
