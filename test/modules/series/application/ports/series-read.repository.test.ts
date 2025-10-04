import { SeriesReadRepository } from '../../../../../src/modules/series/application/ports/series-read.repository';
import { SeriesResponse, SeriesSearchFilters, Genre, Demographic } from '../../../../../src/modules/series/domain/entities/series.entity';
import Year from '../../../../../src/modules/series/domain/entities/year.entity';

describe('SeriesReadRepository Interface', () => {
  let mockRepository: SeriesReadRepository;

  beforeEach(() => {
    mockRepository = {
      findById: jest.fn(),
      findAll: jest.fn(),
      search: jest.fn(),
      getProductions: jest.fn(),
      getProductionYears: jest.fn(),
      getDemographics: jest.fn(),
      getGenres: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Individual queries', () => {
    it('should implement findById method', async () => {
      const id = 1;
      const expectedSeries: SeriesResponse = {
        id: 1,
        name: 'Found Series',
        chapter_numer: 24,
        year: 2023,
        description: 'Found description',
        description_en: 'Found description in English',
        qualification: 9.0,
        demography_id: 1,
        demographic_name: 'Shounen',
        visible: true,
        image: 'found-image.jpg',
        rank: 5,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      };

      mockRepository.findById.mockResolvedValue(expectedSeries);

      const result = await mockRepository.findById(id);

      expect(mockRepository.findById).toHaveBeenCalledWith(id);
      expect(result).toEqual(expectedSeries);
    });

    it('should implement findById method returning null', async () => {
      const id = 999;
      
      mockRepository.findById.mockResolvedValue(null);

      const result = await mockRepository.findById(id);

      expect(mockRepository.findById).toHaveBeenCalledWith(id);
      expect(result).toBeNull();
    });

    it('should implement findAll method', async () => {
      const limit = 10;
      const offset = 0;
      const expectedResult = {
        series: [
          {
            id: 1,
            name: 'Series 1',
            chapter_numer: 12,
            year: 2023,
            description: 'Description 1',
            description_en: 'Description 1 in English',
            qualification: 8.0,
            demography_id: 1,
            demographic_name: 'Shounen',
            visible: true,
            image: 'image1.jpg',
            rank: 1,
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-02'),
          },
          {
            id: 2,
            name: 'Series 2',
            chapter_numer: 24,
            year: 2023,
            description: 'Description 2',
            description_en: 'Description 2 in English',
            qualification: 8.5,
            demography_id: 2,
            demographic_name: 'Shoujo',
            visible: true,
            image: 'image2.jpg',
            rank: 2,
            created_at: new Date('2023-01-01'),
            updated_at: new Date('2023-01-02'),
          },
        ],
        total: 2,
      };

      mockRepository.findAll.mockResolvedValue(expectedResult);

      const result = await mockRepository.findAll(limit, offset);

      expect(mockRepository.findAll).toHaveBeenCalledWith(limit, offset);
      expect(result).toEqual(expectedResult);
      expect(result.series).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should implement findAll method with empty results', async () => {
      const limit = 10;
      const offset = 1000;
      const expectedResult = {
        series: [],
        total: 0,
      };

      mockRepository.findAll.mockResolvedValue(expectedResult);

      const result = await mockRepository.findAll(limit, offset);

      expect(mockRepository.findAll).toHaveBeenCalledWith(limit, offset);
      expect(result).toEqual(expectedResult);
      expect(result.series).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('Search operations', () => {
    it('should implement search method', async () => {
      const filters: SeriesSearchFilters = {
        name: 'Action',
        year: 2023,
        demography_id: 1,
        qualification: 8.0,
      };

      const expectedResults: SeriesResponse[] = [
        {
          id: 1,
          name: 'Action Series',
          chapter_numer: 12,
          year: 2023,
          description: 'Action description',
          description_en: 'Action description in English',
          qualification: 8.5,
          demography_id: 1,
          demographic_name: 'Shounen',
          visible: true,
          image: 'action-image.jpg',
          rank: 3,
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-02'),
        },
      ];

      mockRepository.search.mockResolvedValue(expectedResults);

      const result = await mockRepository.search(filters);

      expect(mockRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResults);
    });

    it('should implement search method with empty filters', async () => {
      const filters: SeriesSearchFilters = {};

      const expectedResults: SeriesResponse[] = [];

      mockRepository.search.mockResolvedValue(expectedResults);

      const result = await mockRepository.search(filters);

      expect(mockRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResults);
    });
  });

  describe('Production queries', () => {
    it('should implement getProductions method', async () => {
      const expectedProductions: SeriesResponse[] = [
        {
          id: 1,
          name: 'Production 1',
          chapter_numer: 12,
          year: 2023,
          description: 'Production 1 description',
          description_en: 'Production 1 description in English',
          qualification: 8.0,
          demography_id: 1,
          demographic_name: 'Shounen',
          visible: true,
          image: 'prod1-image.jpg',
          rank: 1,
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-02'),
        },
        {
          id: 2,
          name: 'Production 2',
          chapter_numer: 24,
          year: 2023,
          description: 'Production 2 description',
          description_en: 'Production 2 description in English',
          qualification: 8.5,
          demography_id: 2,
          demographic_name: 'Shoujo',
          visible: true,
          image: 'prod2-image.jpg',
          rank: 2,
          created_at: new Date('2023-01-01'),
          updated_at: new Date('2023-01-02'),
        },
      ];

      mockRepository.getProductions.mockResolvedValue(expectedProductions);

      const result = await mockRepository.getProductions();

      expect(mockRepository.getProductions).toHaveBeenCalledWith();
      expect(result).toEqual(expectedProductions);
      expect(result).toHaveLength(2);
    });

    it('should implement getProductions method with empty results', async () => {
      const expectedProductions: SeriesResponse[] = [];

      mockRepository.getProductions.mockResolvedValue(expectedProductions);

      const result = await mockRepository.getProductions();

      expect(mockRepository.getProductions).toHaveBeenCalledWith();
      expect(result).toEqual(expectedProductions);
      expect(result).toHaveLength(0);
    });
  });

  describe('Catalog queries', () => {
    it('should implement getProductionYears method', async () => {
      const expectedYears: Year[] = [
        { years: '2020' },
        { years: '2021' },
        { years: '2022' },
        { years: '2023' },
        { years: '2024' },
      ];

      mockRepository.getProductionYears.mockResolvedValue(expectedYears);

      const result = await mockRepository.getProductionYears();

      expect(mockRepository.getProductionYears).toHaveBeenCalledWith();
      expect(result).toEqual(expectedYears);
      expect(result).toHaveLength(5);
    });

    it('should implement getDemographics method', async () => {
      const expectedDemographics: Demographic[] = [
        { id: 1, name: 'Shounen' },
        { id: 2, name: 'Shoujo' },
        { id: 3, name: 'Seinen' },
        { id: 4, name: 'Josei' },
      ];

      mockRepository.getDemographics.mockResolvedValue(expectedDemographics);

      const result = await mockRepository.getDemographics();

      expect(mockRepository.getDemographics).toHaveBeenCalledWith();
      expect(result).toEqual(expectedDemographics);
      expect(result).toHaveLength(4);
    });

    it('should implement getGenres method', async () => {
      const expectedGenres: Genre[] = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Adventure' },
        { id: 3, name: 'Comedy' },
        { id: 4, name: 'Drama' },
        { id: 5, name: 'Fantasy' },
        { id: 6, name: 'Romance' },
      ];

      mockRepository.getGenres.mockResolvedValue(expectedGenres);

      const result = await mockRepository.getGenres();

      expect(mockRepository.getGenres).toHaveBeenCalledWith();
      expect(result).toEqual(expectedGenres);
      expect(result).toHaveLength(6);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero and negative IDs', async () => {
      const zeroId = 0;
      const negativeId = -1;

      mockRepository.findById.mockResolvedValue(null);

      await mockRepository.findById(zeroId);
      await mockRepository.findById(negativeId);

      expect(mockRepository.findById).toHaveBeenCalledWith(zeroId);
      expect(mockRepository.findById).toHaveBeenCalledWith(negativeId);
    });

    it('should handle large numbers', async () => {
      const largeId = 999999999;
      const largeLimit = 999999;
      const largeOffset = 999999;

      mockRepository.findById.mockResolvedValue(null);
      mockRepository.findAll.mockResolvedValue({ series: [], total: 0 });

      await mockRepository.findById(largeId);
      await mockRepository.findAll(largeLimit, largeOffset);

      expect(mockRepository.findById).toHaveBeenCalledWith(largeId);
      expect(mockRepository.findAll).toHaveBeenCalledWith(largeLimit, largeOffset);
    });

    it('should handle special characters in search filters', async () => {
      const filters: SeriesSearchFilters = {
        name: 'Series with Special !@#$%^&*() Characters',
        year: 2023,
        demography_id: 1,
        qualification: 8.0,
      };

      const expectedResults: SeriesResponse[] = [];

      mockRepository.search.mockResolvedValue(expectedResults);

      const result = await mockRepository.search(filters);

      expect(mockRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResults);
    });

    it('should handle unicode characters in demographic and genre names', async () => {
      const expectedDemographics: Demographic[] = [
        { id: 1, name: 'Shounen with émojis 🎌' },
        { id: 2, name: 'Shoujo with ñ characters' },
      ];

      const expectedGenres: Genre[] = [
        { id: 1, name: 'Action with unicode: áéíóú' },
        { id: 2, name: 'Adventure with special chars: !@#' },
      ];

      mockRepository.getDemographics.mockResolvedValue(expectedDemographics);
      mockRepository.getGenres.mockResolvedValue(expectedGenres);

      const demographics = await mockRepository.getDemographics();
      const genres = await mockRepository.getGenres();

      expect(demographics).toEqual(expectedDemographics);
      expect(genres).toEqual(expectedGenres);
    });

    it('should handle very long year strings', async () => {
      const expectedYears: Year[] = [
        { years: '2023202420252026' },
        { years: '1990-1999' },
        { years: '2000-2009' },
      ];

      mockRepository.getProductionYears.mockResolvedValue(expectedYears);

      const result = await mockRepository.getProductionYears();

      expect(result).toEqual(expectedYears);
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed');

      mockRepository.findById.mockRejectedValue(error);
      mockRepository.findAll.mockRejectedValue(error);
      mockRepository.search.mockRejectedValue(error);
      mockRepository.getProductions.mockRejectedValue(error);
      mockRepository.getProductionYears.mockRejectedValue(error);
      mockRepository.getDemographics.mockRejectedValue(error);
      mockRepository.getGenres.mockRejectedValue(error);

      await expect(mockRepository.findById(1)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.findAll(10, 0)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.search({})).rejects.toThrow('Database connection failed');
      await expect(mockRepository.getProductions()).rejects.toThrow('Database connection failed');
      await expect(mockRepository.getProductionYears()).rejects.toThrow('Database connection failed');
      await expect(mockRepository.getDemographics()).rejects.toThrow('Database connection failed');
      await expect(mockRepository.getGenres()).rejects.toThrow('Database connection failed');
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Query timeout');

      mockRepository.search.mockRejectedValue(timeoutError);

      await expect(mockRepository.search({ name: 'test' })).rejects.toThrow('Query timeout');
    });

    it('should handle invalid data errors', async () => {
      const invalidDataError = new Error('Invalid data format');

      mockRepository.getProductions.mockRejectedValue(invalidDataError);

      await expect(mockRepository.getProductions()).rejects.toThrow('Invalid data format');
    });
  });
});
