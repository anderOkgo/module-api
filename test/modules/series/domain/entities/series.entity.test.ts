import Series, {
  SeriesCreateRequest,
  SeriesUpdateRequest,
  SeriesResponse,
  SeriesSearchRequest,
  SeriesSearchResponse,
  SeriesWithTitles,
  SeriesWithGenres,
  SeriesComplete,
} from '../../../../../src/modules/series/domain/entities/series.entity';

describe('Series Entity', () => {
  describe('Series interface', () => {
    it('should have all required properties', () => {
      const series: Series = {
        id: 1,
        name: 'Test Series',
        chapter_numer: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
      };

      expect(series.id).toBe(1);
      expect(series.name).toBe('Test Series');
      expect(series.chapter_numer).toBe(12);
      expect(series.year).toBe(2023);
      expect(series.description).toBe('Test description');
      expect(series.description_en).toBe('Test description in English');
      expect(series.qualification).toBe(8.5);
      expect(series.demography_id).toBe(1);
      expect(series.visible).toBe(true);
    });

    it('should handle optional properties', () => {
      const series: Series = {
        id: 1,
        name: 'Test Series',
        chapter_numer: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: 8.5,
        demography_id: 1,
        demographic_name: 'Shounen',
        visible: true,
        image: 'test-image.jpg',
        rank: 1,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      };

      expect(series.demographic_name).toBe('Shounen');
      expect(series.image).toBe('test-image.jpg');
      expect(series.rank).toBe(1);
      expect(series.created_at).toBeInstanceOf(Date);
      expect(series.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('SeriesCreateRequest interface', () => {
    it('should have all required properties for creation', () => {
      const createRequest: SeriesCreateRequest = {
        name: 'New Series',
        chapter_number: 24,
        year: 2024,
        description: 'New series description',
        description_en: 'New series description in English',
        qualification: 9.0,
        demography_id: 2,
        visible: true,
        image: 'new-series.jpg',
      };

      expect(createRequest.name).toBe('New Series');
      expect(createRequest.chapter_number).toBe(24);
      expect(createRequest.year).toBe(2024);
      expect(createRequest.description).toBe('New series description');
      expect(createRequest.description_en).toBe('New series description in English');
      expect(createRequest.qualification).toBe(9.0);
      expect(createRequest.demography_id).toBe(2);
      expect(createRequest.visible).toBe(true);
      expect(createRequest.image).toBe('new-series.jpg');
    });

    it('should handle optional image property', () => {
      const createRequest: SeriesCreateRequest = {
        name: 'Series Without Image',
        chapter_number: 12,
        year: 2023,
        description: 'Description',
        description_en: 'Description in English',
        qualification: 7.5,
        demography_id: 1,
        visible: false,
      };

      expect(createRequest.image).toBeUndefined();
    });
  });

  describe('SeriesUpdateRequest interface', () => {
    it('should have all required properties for update', () => {
      const updateRequest: SeriesUpdateRequest = {
        id: 1,
        name: 'Updated Series',
        chapter_number: 36,
        year: 2025,
        description: 'Updated description',
        description_en: 'Updated description in English',
        qualification: 9.5,
        demography_id: 3,
        visible: true,
        image: 'updated-image.jpg',
      };

      expect(updateRequest.id).toBe(1);
      expect(updateRequest.name).toBe('Updated Series');
      expect(updateRequest.chapter_number).toBe(36);
      expect(updateRequest.year).toBe(2025);
      expect(updateRequest.description).toBe('Updated description');
      expect(updateRequest.description_en).toBe('Updated description in English');
      expect(updateRequest.qualification).toBe(9.5);
      expect(updateRequest.demography_id).toBe(3);
      expect(updateRequest.visible).toBe(true);
      expect(updateRequest.image).toBe('updated-image.jpg');
    });
  });

  describe('SeriesResponse interface', () => {
    it('should have all required properties for response', () => {
      const response: SeriesResponse = {
        id: 1,
        name: 'Response Series',
        chapter_numer: 48,
        year: 2023,
        description: 'Response description',
        description_en: 'Response description in English',
        qualification: 8.0,
        demography_id: 1,
        demographic_name: 'Seinen',
        visible: true,
        image: 'response-image.jpg',
        rank: 5,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      };

      expect(response.id).toBe(1);
      expect(response.name).toBe('Response Series');
      expect(response.chapter_numer).toBe(48);
      expect(response.year).toBe(2023);
      expect(response.demographic_name).toBe('Seinen');
      expect(response.rank).toBe(5);
    });
  });

  describe('SeriesSearchRequest interface', () => {
    it('should handle search with all parameters', () => {
      const searchRequest: SeriesSearchRequest = {
        name: 'Search Term',
        year: 2023,
        demography_id: 1,
        qualification: 8.0,
        limit: 20,
        offset: 0,
      };

      expect(searchRequest.name).toBe('Search Term');
      expect(searchRequest.year).toBe(2023);
      expect(searchRequest.demography_id).toBe(1);
      expect(searchRequest.qualification).toBe(8.0);
      expect(searchRequest.limit).toBe(20);
      expect(searchRequest.offset).toBe(0);
    });

    it('should handle search with minimal parameters', () => {
      const searchRequest: SeriesSearchRequest = {
        name: 'Minimal Search',
      };

      expect(searchRequest.name).toBe('Minimal Search');
      expect(searchRequest.year).toBeUndefined();
      expect(searchRequest.demography_id).toBeUndefined();
      expect(searchRequest.qualification).toBeUndefined();
      expect(searchRequest.limit).toBeUndefined();
      expect(searchRequest.offset).toBeUndefined();
    });
  });

  describe('SeriesSearchResponse interface', () => {
    it('should have search results with pagination', () => {
      const searchResponse: SeriesSearchResponse = {
        series: [
          {
            id: 1,
            name: 'Search Result 1',
            chapter_numer: 12,
            year: 2023,
            description: 'Description 1',
            description_en: 'Description 1 in English',
            qualification: 8.5,
            demography_id: 1,
            visible: true,
          },
        ],
        total: 1,
        limit: 20,
        offset: 0,
      };

      expect(searchResponse.series).toHaveLength(1);
      expect(searchResponse.total).toBe(1);
      expect(searchResponse.limit).toBe(20);
      expect(searchResponse.offset).toBe(0);
      expect(searchResponse.series[0].name).toBe('Search Result 1');
    });
  });

  describe('SeriesWithTitles interface', () => {
    it('should have series with titles array', () => {
      const seriesWithTitles: SeriesWithTitles = {
        id: 1,
        name: 'Series with Titles',
        chapter_numer: 12,
        year: 2023,
        description: 'Description',
        description_en: 'Description in English',
        qualification: 8.0,
        demography_id: 1,
        visible: true,
        titles: [
          { id: 1, title: 'Title 1' },
          { id: 2, title: 'Title 2' },
        ],
      };

      expect(seriesWithTitles.titles).toHaveLength(2);
      expect(seriesWithTitles.titles[0].title).toBe('Title 1');
      expect(seriesWithTitles.titles[1].title).toBe('Title 2');
    });
  });

  describe('SeriesWithGenres interface', () => {
    it('should have series with genres array', () => {
      const seriesWithGenres: SeriesWithGenres = {
        id: 1,
        name: 'Series with Genres',
        chapter_numer: 12,
        year: 2023,
        description: 'Description',
        description_en: 'Description in English',
        qualification: 8.0,
        demography_id: 1,
        visible: true,
        genres: [
          { id: 1, name: 'Action' },
          { id: 2, name: 'Adventure' },
        ],
      };

      expect(seriesWithGenres.genres).toHaveLength(2);
      expect(seriesWithGenres.genres[0].name).toBe('Action');
      expect(seriesWithGenres.genres[1].name).toBe('Adventure');
    });
  });

  describe('SeriesComplete interface', () => {
    it('should have series with both titles and genres', () => {
      const seriesComplete: SeriesComplete = {
        id: 1,
        name: 'Complete Series',
        chapter_numer: 12,
        year: 2023,
        description: 'Description',
        description_en: 'Description in English',
        qualification: 8.0,
        demography_id: 1,
        visible: true,
        titles: [{ id: 1, title: 'Title 1' }],
        genres: [{ id: 1, name: 'Action' }],
      };

      expect(seriesComplete.titles).toHaveLength(1);
      expect(seriesComplete.genres).toHaveLength(1);
      expect(seriesComplete.titles[0].title).toBe('Title 1');
      expect(seriesComplete.genres[0].name).toBe('Action');
    });
  });

  describe('Edge cases', () => {
    it('should handle zero values', () => {
      const series: Series = {
        id: 0,
        name: '',
        chapter_numer: 0,
        year: 0,
        description: '',
        description_en: '',
        qualification: 0,
        demography_id: 0,
        visible: false,
      };

      expect(series.id).toBe(0);
      expect(series.name).toBe('');
      expect(series.chapter_numer).toBe(0);
      expect(series.year).toBe(0);
      expect(series.qualification).toBe(0);
      expect(series.demography_id).toBe(0);
      expect(series.visible).toBe(false);
    });

    it('should handle negative values', () => {
      const series: Series = {
        id: -1,
        name: 'Negative Series',
        chapter_numer: -5,
        year: -2023,
        description: 'Negative description',
        description_en: 'Negative description in English',
        qualification: -1.0,
        demography_id: -1,
        visible: false,
      };

      expect(series.id).toBe(-1);
      expect(series.chapter_numer).toBe(-5);
      expect(series.year).toBe(-2023);
      expect(series.qualification).toBe(-1.0);
      expect(series.demography_id).toBe(-1);
    });

    it('should handle large numbers', () => {
      const series: Series = {
        id: 999999999,
        name: 'Large Series',
        chapter_numer: 999999,
        year: 9999,
        description: 'Large description',
        description_en: 'Large description in English',
        qualification: 999.99,
        demography_id: 999999,
        visible: true,
      };

      expect(series.id).toBe(999999999);
      expect(series.chapter_numer).toBe(999999);
      expect(series.year).toBe(9999);
      expect(series.qualification).toBe(999.99);
      expect(series.demography_id).toBe(999999);
    });

    it('should handle special characters in strings', () => {
      const series: Series = {
        id: 1,
        name: 'Series with Special !@#$%^&*() Characters',
        chapter_numer: 12,
        year: 2023,
        description: 'Description with émojis 🎌 and ñ characters',
        description_en: 'Description with special chars: áéíóú',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
      };

      expect(series.name).toBe('Series with Special !@#$%^&*() Characters');
      expect(series.description).toBe('Description with émojis 🎌 and ñ characters');
      expect(series.description_en).toBe('Description with special chars: áéíóú');
    });
  });
});
