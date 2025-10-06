import {
  GetProductionsQuery,
  ProductionFilters,
} from '../../../../../src/modules/series/application/queries/get-productions.query';

describe('GetProductionsQuery', () => {
  it('should create a query with empty filters', () => {
    // Arrange
    const filters: ProductionFilters = {};

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters).toBe(filters);
    expect(query.filters).toEqual({});
    expect(query.cacheKey).toBe('productions:{}');
  });

  it('should create a query with single filter', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters).toBe(filters);
    expect(query.filters.type).toBe('anime');
    expect(query.cacheKey).toBe('productions:{"type":"anime"}');
  });

  it('should create a query with multiple filters', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
      demographic: 'shounen',
      genre: 1,
      state: 'completed',
      production: 'Studio Ghibli',
      year: 2023,
      limit: 20,
      offset: 0,
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters).toBe(filters);
    expect(query.filters.type).toBe('anime');
    expect(query.filters.demographic).toBe('shounen');
    expect(query.filters.genre).toBe(1);
    expect(query.filters.state).toBe('completed');
    expect(query.filters.production).toBe('Studio Ghibli');
    expect(query.filters.year).toBe(2023);
    expect(query.filters.limit).toBe(20);
    expect(query.filters.offset).toBe(0);
    expect(query.cacheKey).toBe(
      'productions:{"type":"anime","demographic":"shounen","genre":1,"state":"completed","production":"Studio Ghibli","year":2023,"limit":20,"offset":0}'
    );
  });

  it('should generate correct cache key for complex filters', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'manga',
      demographic: 'seinen',
      genre: 5,
      year: 2020,
      limit: 50,
      offset: 100,
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    const expectedCacheKey = JSON.stringify(filters);
    expect(query.cacheKey).toBe(`productions:${expectedCacheKey}`);
  });

  it('should handle filters with special characters', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
      production: 'Studio "Ghibli" & Co.',
      state: 'ongoing (2023)',
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters.production).toBe('Studio "Ghibli" & Co.');
    expect(query.filters.state).toBe('ongoing (2023)');
    expect(query.cacheKey).toBe(`productions:${JSON.stringify(filters)}`);
  });

  it('should handle edge case values', () => {
    // Arrange
    const filters: ProductionFilters = {
      genre: 0,
      year: 1900,
      limit: 0,
      offset: 0,
      type: '',
      state: '',
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters.genre).toBe(0);
    expect(query.filters.year).toBe(1900);
    expect(query.filters.limit).toBe(0);
    expect(query.filters.offset).toBe(0);
    expect(query.filters.type).toBe('');
    expect(query.filters.state).toBe('');
  });

  it('should preserve object reference', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
      year: 2023,
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters).toBe(filters); // Same reference
    expect(query.filters).toEqual(filters); // Same content
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
      year: 2023,
    };
    const query = new GetProductionsQuery(filters);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.filters).toBe(filters);
    expect(query.cacheKey).toBe(`productions:${JSON.stringify(filters)}`);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique cache keys for different filters', () => {
    // Arrange
    const filters1: ProductionFilters = { type: 'anime' };
    const filters2: ProductionFilters = { type: 'manga' };
    const filters3: ProductionFilters = { year: 2023 };

    // Act
    const query1 = new GetProductionsQuery(filters1);
    const query2 = new GetProductionsQuery(filters2);
    const query3 = new GetProductionsQuery(filters3);

    // Assert
    expect(query1.cacheKey).not.toBe(query2.cacheKey);
    expect(query1.cacheKey).not.toBe(query3.cacheKey);
    expect(query2.cacheKey).not.toBe(query3.cacheKey);
  });

  it('should maintain consistent cache key for same filters', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
      genre: 1,
      year: 2023,
    };

    // Act
    const query1 = new GetProductionsQuery(filters);
    const query2 = new GetProductionsQuery(filters);

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.filters).toBe(query2.filters);
  });

  it('should handle undefined filter values', () => {
    // Arrange
    const filters: ProductionFilters = {
      type: 'anime',
      genre: undefined,
      year: 2023,
      limit: undefined,
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters.type).toBe('anime');
    expect(query.filters.genre).toBeUndefined();
    expect(query.filters.year).toBe(2023);
    expect(query.filters.limit).toBeUndefined();
    expect(query.cacheKey).toBe(`productions:${JSON.stringify(filters)}`);
  });

  it('should handle large numeric values', () => {
    // Arrange
    const filters: ProductionFilters = {
      year: Number.MAX_SAFE_INTEGER,
      limit: 1000,
      offset: 5000,
    };

    // Act
    const query = new GetProductionsQuery(filters);

    // Assert
    expect(query.filters.year).toBe(Number.MAX_SAFE_INTEGER);
    expect(query.filters.limit).toBe(1000);
    expect(query.filters.offset).toBe(5000);
    expect(query.cacheKey).toBe(`productions:${JSON.stringify(filters)}`);
  });
});
