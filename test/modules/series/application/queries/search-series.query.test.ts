import { SearchSeriesQuery } from '../../../../../src/modules/series/application/queries/search-series.query';
import { SeriesSearchFilters } from '../../../../../src/modules/series/domain/entities/series.entity';

describe('SearchSeriesQuery', () => {
  it('should create a query with empty filters', () => {
    // Arrange
    const filters: SeriesSearchFilters = {};

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters).toBe(filters);
    expect(query.filters).toEqual({});
    expect(query.cacheKey).toBe('series:search:{}');
  });

  it('should create a query with name filter', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Test Series',
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters).toBe(filters);
    expect(query.filters.name).toBe('Test Series');
    expect(query.cacheKey).toBe('series:search:{"name":"Test Series"}');
  });

  it('should create a query with multiple filters', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Test Series',
      year: 2023,
      demography_id: 1,
      genre_ids: [1, 2, 3],
      visible: true,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters).toBe(filters);
    expect(query.filters.name).toBe('Test Series');
    expect(query.filters.year).toBe(2023);
    expect(query.filters.demography_id).toBe(1);
    expect(query.filters.genre_ids).toEqual([1, 2, 3]);
    expect(query.filters.visible).toBe(true);
    expect(query.cacheKey).toBe(
      'series:search:{"name":"Test Series","year":2023,"demography_id":1,"genre_ids":[1,2,3],"visible":true}'
    );
  });

  it('should generate correct cache key for complex filters', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Complex Series',
      year: 2023,
      demography_id: 2,
      genre_ids: [1, 2, 3, 4, 5],
      visible: true,
      limit: 20,
      offset: 0,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    const expectedCacheKey = JSON.stringify(filters);
    expect(query.cacheKey).toBe(`series:search:${expectedCacheKey}`);
  });

  it('should handle filters with special characters', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Series with "quotes" and \'apostrophes\'',
      year: 2023,
      demography_id: 1,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters.name).toBe('Series with "quotes" and \'apostrophes\'');
    expect(query.filters.year).toBe(2023);
    expect(query.filters.demography_id).toBe(1);
    expect(query.cacheKey).toBe(`series:search:${JSON.stringify(filters)}`);
  });

  it('should handle filters with unicode characters', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Título en Español',
      year: 2023,
      visible: true,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters.name).toBe('Título en Español');
    expect(query.filters.year).toBe(2023);
    expect(query.filters.visible).toBe(true);
    expect(query.cacheKey).toBe(`series:search:${JSON.stringify(filters)}`);
  });

  it('should handle edge case values', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      year: 1900,
      demography_id: 0,
      genre_ids: [],
      visible: false,
      limit: 0,
      offset: 0,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters.year).toBe(1900);
    expect(query.filters.demography_id).toBe(0);
    expect(query.filters.genre_ids).toEqual([]);
    expect(query.filters.visible).toBe(false);
    expect(query.filters.limit).toBe(0);
    expect(query.filters.offset).toBe(0);
  });

  it('should preserve object reference', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Test Series',
      year: 2023,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters).toBe(filters); // Same reference
    expect(query.filters).toEqual(filters); // Same content
  });

  it('should be immutable for readonly properties', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Test Series',
      year: 2023,
    };
    const query = new SearchSeriesQuery(filters);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(query.filters).toBe(filters);
    expect(query.cacheKey).toBe(`series:search:${JSON.stringify(filters)}`);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique cache keys for different filters', () => {
    // Arrange
    const filters1: SeriesSearchFilters = { name: 'Series 1' };
    const filters2: SeriesSearchFilters = { name: 'Series 2' };
    const filters3: SeriesSearchFilters = { year: 2023 };

    // Act
    const query1 = new SearchSeriesQuery(filters1);
    const query2 = new SearchSeriesQuery(filters2);
    const query3 = new SearchSeriesQuery(filters3);

    // Assert
    expect(query1.cacheKey).not.toBe(query2.cacheKey);
    expect(query1.cacheKey).not.toBe(query3.cacheKey);
    expect(query2.cacheKey).not.toBe(query3.cacheKey);
  });

  it('should maintain consistent cache key for same filters', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Test Series',
      year: 2023,
      genre_ids: [1, 2, 3],
    };

    // Act
    const query1 = new SearchSeriesQuery(filters);
    const query2 = new SearchSeriesQuery(filters);

    // Assert
    expect(query1.cacheKey).toBe(query2.cacheKey);
    expect(query1.filters).toBe(query2.filters);
  });

  it('should handle deeply nested filter objects', () => {
    // Arrange
    const filters: SeriesSearchFilters = {
      name: 'Deep Series',
      genre_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      year: 2023,
      visible: true,
      limit: 100,
      offset: 10,
    };

    // Act
    const query = new SearchSeriesQuery(filters);

    // Assert
    expect(query.filters.genre_ids?.length).toBe(10);
    expect(query.filters.visible).toBe(true);
    expect(query.filters.limit).toBe(100);
    expect(query.filters.offset).toBe(10);
    expect(query.cacheKey).toBe(`series:search:${JSON.stringify(filters)}`);
  });
});
