import { ProductionRepository } from '../../../../../src/modules/series/application/ports/series.repository';
import Serie, { SeriesCreateRequest, SeriesUpdateRequest, SeriesSearchFilters, Genre, Demographic } from '../../../../../src/modules/series/domain/entities/series.entity';
import Year from '../../../../../src/modules/series/domain/entities/year.entity';

describe('ProductionRepository Interface', () => {
  let mockRepository: ProductionRepository;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      search: jest.fn(),
      getProduction: jest.fn(),
      updateImage: jest.fn(),
      assignGenres: jest.fn(),
      removeGenres: jest.fn(),
      addTitles: jest.fn(),
      removeTitles: jest.fn(),
      getGenres: jest.fn(),
      getDemographics: jest.fn(),
      getProductionYears: jest.fn(),
      updateRank: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('CRUD operations', () => {
    it('should implement create method', async () => {
      const createRequest: SeriesCreateRequest = {
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'test-image.jpg',
      };

      const expectedSeries: Serie = {
        id: 1,
        name: 'Test Series',
        chapter_numer: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'test-image.jpg',
      };

      mockRepository.create.mockResolvedValue(expectedSeries);

      const result = await mockRepository.create(createRequest);

      expect(mockRepository.create).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(expectedSeries);
    });

    it('should implement findById method', async () => {
      const id = 1;
      const expectedSeries: Serie = {
        id: 1,
        name: 'Found Series',
        chapter_numer: 24,
        year: 2023,
        description: 'Found description',
        description_en: 'Found description in English',
        qualification: 9.0,
        demography_id: 1,
        visible: true,
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
      const expectedSeries: Serie[] = [
        {
          id: 1,
          name: 'Series 1',
          chapter_numer: 12,
          year: 2023,
          description: 'Description 1',
          description_en: 'Description 1 in English',
          qualification: 8.0,
          demography_id: 1,
          visible: true,
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
          visible: true,
        },
      ];

      mockRepository.findAll.mockResolvedValue(expectedSeries);

      const result = await mockRepository.findAll();

      expect(mockRepository.findAll).toHaveBeenCalledWith();
      expect(result).toEqual(expectedSeries);
    });

    it('should implement findAll method with pagination', async () => {
      const limit = 10;
      const offset = 20;
      const expectedSeries: Serie[] = [];

      mockRepository.findAll.mockResolvedValue(expectedSeries);

      const result = await mockRepository.findAll(limit, offset);

      expect(mockRepository.findAll).toHaveBeenCalledWith(limit, offset);
      expect(result).toEqual(expectedSeries);
    });

    it('should implement update method', async () => {
      const id = 1;
      const updateRequest: SeriesUpdateRequest = {
        id: 1,
        name: 'Updated Series',
        chapter_number: 36,
        year: 2024,
        description: 'Updated description',
        description_en: 'Updated description in English',
        qualification: 9.5,
        demography_id: 2,
        visible: true,
        image: 'updated-image.jpg',
      };

      const expectedSeries: Serie = {
        id: 1,
        name: 'Updated Series',
        chapter_numer: 36,
        year: 2024,
        description: 'Updated description',
        description_en: 'Updated description in English',
        qualification: 9.5,
        demography_id: 2,
        visible: true,
        image: 'updated-image.jpg',
      };

      mockRepository.update.mockResolvedValue(expectedSeries);

      const result = await mockRepository.update(id, updateRequest);

      expect(mockRepository.update).toHaveBeenCalledWith(id, updateRequest);
      expect(result).toEqual(expectedSeries);
    });

    it('should implement delete method', async () => {
      const id = 1;

      mockRepository.delete.mockResolvedValue(true);

      const result = await mockRepository.delete(id);

      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(true);
    });

    it('should implement delete method returning false', async () => {
      const id = 999;

      mockRepository.delete.mockResolvedValue(false);

      const result = await mockRepository.delete(id);

      expect(mockRepository.delete).toHaveBeenCalledWith(id);
      expect(result).toBe(false);
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

      const expectedResults: Serie[] = [
        {
          id: 1,
          name: 'Action Series',
          chapter_numer: 12,
          year: 2023,
          description: 'Action description',
          description_en: 'Action description in English',
          qualification: 8.5,
          demography_id: 1,
          visible: true,
        },
      ];

      mockRepository.search.mockResolvedValue(expectedResults);

      const result = await mockRepository.search(filters);

      expect(mockRepository.search).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResults);
    });

    it('should implement getProduction method', async () => {
      const production: Serie = {
        id: 1,
        name: 'Production Series',
        chapter_numer: 12,
        year: 2023,
        description: 'Production description',
        description_en: 'Production description in English',
        qualification: 8.0,
        demography_id: 1,
        visible: true,
      };

      const expectedResults: Serie[] = [production];

      mockRepository.getProduction.mockResolvedValue(expectedResults);

      const result = await mockRepository.getProduction(production);

      expect(mockRepository.getProduction).toHaveBeenCalledWith(production);
      expect(result).toEqual(expectedResults);
    });
  });

  describe('Image operations', () => {
    it('should implement updateImage method', async () => {
      const id = 1;
      const imagePath = '/images/series/1/new-image.jpg';

      mockRepository.updateImage.mockResolvedValue(true);

      const result = await mockRepository.updateImage(id, imagePath);

      expect(mockRepository.updateImage).toHaveBeenCalledWith(id, imagePath);
      expect(result).toBe(true);
    });

    it('should implement updateImage method returning false', async () => {
      const id = 999;
      const imagePath = '/images/series/999/invalid-image.jpg';

      mockRepository.updateImage.mockResolvedValue(false);

      const result = await mockRepository.updateImage(id, imagePath);

      expect(mockRepository.updateImage).toHaveBeenCalledWith(id, imagePath);
      expect(result).toBe(false);
    });
  });

  describe('Relationship operations', () => {
    it('should implement assignGenres method', async () => {
      const seriesId = 1;
      const genreIds = [1, 2, 3];

      mockRepository.assignGenres.mockResolvedValue(true);

      const result = await mockRepository.assignGenres(seriesId, genreIds);

      expect(mockRepository.assignGenres).toHaveBeenCalledWith(seriesId, genreIds);
      expect(result).toBe(true);
    });

    it('should implement removeGenres method', async () => {
      const seriesId = 1;
      const genreIds = [2, 3];

      mockRepository.removeGenres.mockResolvedValue(true);

      const result = await mockRepository.removeGenres(seriesId, genreIds);

      expect(mockRepository.removeGenres).toHaveBeenCalledWith(seriesId, genreIds);
      expect(result).toBe(true);
    });

    it('should implement addTitles method', async () => {
      const seriesId = 1;
      const titles = ['Title 1', 'Title 2', 'Title 3'];

      mockRepository.addTitles.mockResolvedValue(true);

      const result = await mockRepository.addTitles(seriesId, titles);

      expect(mockRepository.addTitles).toHaveBeenCalledWith(seriesId, titles);
      expect(result).toBe(true);
    });

    it('should implement removeTitles method', async () => {
      const seriesId = 1;
      const titleIds = [1, 3];

      mockRepository.removeTitles.mockResolvedValue(true);

      const result = await mockRepository.removeTitles(seriesId, titleIds);

      expect(mockRepository.removeTitles).toHaveBeenCalledWith(seriesId, titleIds);
      expect(result).toBe(true);
    });
  });

  describe('Catalog operations', () => {
    it('should implement getGenres method', async () => {
      const expectedGenres: Genre[] = [
        { id: 1, name: 'Action' },
        { id: 2, name: 'Adventure' },
        { id: 3, name: 'Comedy' },
      ];

      mockRepository.getGenres.mockResolvedValue(expectedGenres);

      const result = await mockRepository.getGenres();

      expect(mockRepository.getGenres).toHaveBeenCalledWith();
      expect(result).toEqual(expectedGenres);
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
    });

    it('should implement getProductionYears method', async () => {
      const expectedYears: Year[] = [
        { years: '2020' },
        { years: '2021' },
        { years: '2022' },
        { years: '2023' },
      ];

      mockRepository.getProductionYears.mockResolvedValue(expectedYears);

      const result = await mockRepository.getProductionYears();

      expect(mockRepository.getProductionYears).toHaveBeenCalledWith();
      expect(result).toEqual(expectedYears);
    });
  });

  describe('Maintenance operations', () => {
    it('should implement updateRank method', async () => {
      mockRepository.updateRank.mockResolvedValue();

      await mockRepository.updateRank();

      expect(mockRepository.updateRank).toHaveBeenCalledWith();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty arrays', async () => {
      const seriesId = 1;
      const emptyArray: number[] = [];
      const emptyStringArray: string[] = [];

      mockRepository.assignGenres.mockResolvedValue(true);
      mockRepository.removeGenres.mockResolvedValue(true);
      mockRepository.addTitles.mockResolvedValue(true);
      mockRepository.removeTitles.mockResolvedValue(true);

      await mockRepository.assignGenres(seriesId, emptyArray);
      await mockRepository.removeGenres(seriesId, emptyArray);
      await mockRepository.addTitles(seriesId, emptyStringArray);
      await mockRepository.removeTitles(seriesId, emptyArray);

      expect(mockRepository.assignGenres).toHaveBeenCalledWith(seriesId, emptyArray);
      expect(mockRepository.removeGenres).toHaveBeenCalledWith(seriesId, emptyArray);
      expect(mockRepository.addTitles).toHaveBeenCalledWith(seriesId, emptyStringArray);
      expect(mockRepository.removeTitles).toHaveBeenCalledWith(seriesId, emptyArray);
    });

    it('should handle zero and negative IDs', async () => {
      const zeroId = 0;
      const negativeId = -1;

      mockRepository.findById.mockResolvedValue(null);
      mockRepository.delete.mockResolvedValue(false);

      await mockRepository.findById(zeroId);
      await mockRepository.findById(negativeId);
      await mockRepository.delete(zeroId);
      await mockRepository.delete(negativeId);

      expect(mockRepository.findById).toHaveBeenCalledWith(zeroId);
      expect(mockRepository.findById).toHaveBeenCalledWith(negativeId);
      expect(mockRepository.delete).toHaveBeenCalledWith(zeroId);
      expect(mockRepository.delete).toHaveBeenCalledWith(negativeId);
    });

    it('should handle large numbers', async () => {
      const largeId = 999999999;
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);

      mockRepository.findById.mockResolvedValue(null);
      mockRepository.assignGenres.mockResolvedValue(true);

      await mockRepository.findById(largeId);
      await mockRepository.assignGenres(largeId, largeArray);

      expect(mockRepository.findById).toHaveBeenCalledWith(largeId);
      expect(mockRepository.assignGenres).toHaveBeenCalledWith(largeId, largeArray);
    });

    it('should handle special characters in strings', async () => {
      const specialTitles = [
        'Title with Special !@#$%^&*() Characters',
        'Title with émojis 🎌 and ñ characters',
        'Title with unicode: áéíóú',
      ];

      mockRepository.addTitles.mockResolvedValue(true);

      await mockRepository.addTitles(1, specialTitles);

      expect(mockRepository.addTitles).toHaveBeenCalledWith(1, specialTitles);
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed');

      mockRepository.findById.mockRejectedValue(error);
      mockRepository.create.mockRejectedValue(error);
      mockRepository.update.mockRejectedValue(error);
      mockRepository.delete.mockRejectedValue(error);

      await expect(mockRepository.findById(1)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.create({} as SeriesCreateRequest)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.update(1, {} as SeriesUpdateRequest)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.delete(1)).rejects.toThrow('Database connection failed');
    });
  });
});
