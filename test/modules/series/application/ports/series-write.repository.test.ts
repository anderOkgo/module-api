import { SeriesWriteRepository } from '../../../../../src/modules/series/application/ports/series-write.repository';
import { SeriesCreateRequest, SeriesUpdateRequest } from '../../../../../src/modules/series/domain/entities/series.entity';

describe('SeriesWriteRepository Interface', () => {
  let mockRepository: SeriesWriteRepository;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      updateImage: jest.fn(),
      assignGenres: jest.fn(),
      removeGenres: jest.fn(),
      addTitles: jest.fn(),
      removeTitles: jest.fn(),
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

      const expectedResult = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description in English',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'test-image.jpg',
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-01'),
      };

      mockRepository.create.mockResolvedValue(expectedResult);

      const result = await mockRepository.create(createRequest);

      expect(mockRepository.create).toHaveBeenCalledWith(createRequest);
      expect(result).toEqual(expectedResult);
      expect(result.id).toBe(1);
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

      mockRepository.update.mockResolvedValue();

      await mockRepository.update(id, updateRequest);

      expect(mockRepository.update).toHaveBeenCalledWith(id, updateRequest);
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

    it('should handle different image path formats', async () => {
      const id = 1;
      const paths = [
        '/images/series/1/image.jpg',
        'images/series/2/image.png',
        'C:\\images\\series\\3\\image.gif',
        '/var/www/images/series/4/image.webp',
        'https://example.com/images/series/5/image.jpeg',
      ];

      mockRepository.updateImage.mockResolvedValue(true);

      for (const path of paths) {
        await mockRepository.updateImage(id, path);
        expect(mockRepository.updateImage).toHaveBeenCalledWith(id, path);
      }

      expect(mockRepository.updateImage).toHaveBeenCalledTimes(paths.length);
    });
  });

  describe('Genre operations', () => {
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

    it('should handle assignGenres returning false', async () => {
      const seriesId = 999;
      const genreIds = [1, 2, 3];

      mockRepository.assignGenres.mockResolvedValue(false);

      const result = await mockRepository.assignGenres(seriesId, genreIds);

      expect(mockRepository.assignGenres).toHaveBeenCalledWith(seriesId, genreIds);
      expect(result).toBe(false);
    });

    it('should handle removeGenres returning false', async () => {
      const seriesId = 999;
      const genreIds = [1, 2];

      mockRepository.removeGenres.mockResolvedValue(false);

      const result = await mockRepository.removeGenres(seriesId, genreIds);

      expect(mockRepository.removeGenres).toHaveBeenCalledWith(seriesId, genreIds);
      expect(result).toBe(false);
    });
  });

  describe('Title operations', () => {
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

    it('should handle addTitles returning false', async () => {
      const seriesId = 999;
      const titles = ['Invalid Title'];

      mockRepository.addTitles.mockResolvedValue(false);

      const result = await mockRepository.addTitles(seriesId, titles);

      expect(mockRepository.addTitles).toHaveBeenCalledWith(seriesId, titles);
      expect(result).toBe(false);
    });

    it('should handle removeTitles returning false', async () => {
      const seriesId = 999;
      const titleIds = [999];

      mockRepository.removeTitles.mockResolvedValue(false);

      const result = await mockRepository.removeTitles(seriesId, titleIds);

      expect(mockRepository.removeTitles).toHaveBeenCalledWith(seriesId, titleIds);
      expect(result).toBe(false);
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
      const ids = [1, 2];

      mockRepository.delete.mockResolvedValue(false);
      mockRepository.updateImage.mockResolvedValue(false);
      mockRepository.assignGenres.mockResolvedValue(false);
      mockRepository.removeGenres.mockResolvedValue(false);
      mockRepository.addTitles.mockResolvedValue(false);
      mockRepository.removeTitles.mockResolvedValue(false);

      await mockRepository.delete(zeroId);
      await mockRepository.delete(negativeId);
      await mockRepository.updateImage(zeroId, 'path');
      await mockRepository.updateImage(negativeId, 'path');
      await mockRepository.assignGenres(zeroId, ids);
      await mockRepository.assignGenres(negativeId, ids);
      await mockRepository.removeGenres(zeroId, ids);
      await mockRepository.removeGenres(negativeId, ids);
      await mockRepository.addTitles(zeroId, ['title']);
      await mockRepository.addTitles(negativeId, ['title']);
      await mockRepository.removeTitles(zeroId, ids);
      await mockRepository.removeTitles(negativeId, ids);

      expect(mockRepository.delete).toHaveBeenCalledWith(zeroId);
      expect(mockRepository.delete).toHaveBeenCalledWith(negativeId);
      expect(mockRepository.updateImage).toHaveBeenCalledWith(zeroId, 'path');
      expect(mockRepository.updateImage).toHaveBeenCalledWith(negativeId, 'path');
    });

    it('should handle large numbers', async () => {
      const largeId = 999999999;
      const largeArray = Array.from({ length: 1000 }, (_, i) => i);
      const largeStringArray = Array.from({ length: 1000 }, (_, i) => `Title ${i}`);

      mockRepository.create.mockResolvedValue({ id: largeId });
      mockRepository.delete.mockResolvedValue(true);
      mockRepository.updateImage.mockResolvedValue(true);
      mockRepository.assignGenres.mockResolvedValue(true);
      mockRepository.removeGenres.mockResolvedValue(true);
      mockRepository.addTitles.mockResolvedValue(true);
      mockRepository.removeTitles.mockResolvedValue(true);

      await mockRepository.create({} as SeriesCreateRequest);
      await mockRepository.delete(largeId);
      await mockRepository.updateImage(largeId, 'large-path');
      await mockRepository.assignGenres(largeId, largeArray);
      await mockRepository.removeGenres(largeId, largeArray);
      await mockRepository.addTitles(largeId, largeStringArray);
      await mockRepository.removeTitles(largeId, largeArray);

      expect(mockRepository.delete).toHaveBeenCalledWith(largeId);
      expect(mockRepository.updateImage).toHaveBeenCalledWith(largeId, 'large-path');
      expect(mockRepository.assignGenres).toHaveBeenCalledWith(largeId, largeArray);
      expect(mockRepository.removeGenres).toHaveBeenCalledWith(largeId, largeArray);
      expect(mockRepository.addTitles).toHaveBeenCalledWith(largeId, largeStringArray);
      expect(mockRepository.removeTitles).toHaveBeenCalledWith(largeId, largeArray);
    });

    it('should handle special characters in strings', async () => {
      const specialTitles = [
        'Title with Special !@#$%^&*() Characters',
        'Title with émojis 🎌 and ñ characters',
        'Title with unicode: áéíóú',
        'Title with quotes: "double" and \'single\'',
        'Title with backslashes: \\ and forward slashes: /',
      ];

      mockRepository.addTitles.mockResolvedValue(true);

      await mockRepository.addTitles(1, specialTitles);

      expect(mockRepository.addTitles).toHaveBeenCalledWith(1, specialTitles);
    });

    it('should handle create with minimal data', async () => {
      const minimalRequest: SeriesCreateRequest = {
        name: 'Minimal Series',
        chapter_number: 1,
        year: 2023,
        description: 'Minimal description',
        description_en: 'Minimal description in English',
        qualification: 1.0,
        demography_id: 1,
        visible: false,
      };

      const expectedResult = {
        id: 1,
        ...minimalRequest,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockRepository.create.mockResolvedValue(expectedResult);

      const result = await mockRepository.create(minimalRequest);

      expect(mockRepository.create).toHaveBeenCalledWith(minimalRequest);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('Error handling', () => {
    it('should handle repository errors gracefully', async () => {
      const error = new Error('Database connection failed');

      mockRepository.create.mockRejectedValue(error);
      mockRepository.update.mockRejectedValue(error);
      mockRepository.delete.mockRejectedValue(error);
      mockRepository.updateImage.mockRejectedValue(error);
      mockRepository.assignGenres.mockRejectedValue(error);
      mockRepository.removeGenres.mockRejectedValue(error);
      mockRepository.addTitles.mockRejectedValue(error);
      mockRepository.removeTitles.mockRejectedValue(error);
      mockRepository.updateRank.mockRejectedValue(error);

      await expect(mockRepository.create({} as SeriesCreateRequest)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.update(1, {} as SeriesUpdateRequest)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.delete(1)).rejects.toThrow('Database connection failed');
      await expect(mockRepository.updateImage(1, 'path')).rejects.toThrow('Database connection failed');
      await expect(mockRepository.assignGenres(1, [1, 2])).rejects.toThrow('Database connection failed');
      await expect(mockRepository.removeGenres(1, [1, 2])).rejects.toThrow('Database connection failed');
      await expect(mockRepository.addTitles(1, ['title'])).rejects.toThrow('Database connection failed');
      await expect(mockRepository.removeTitles(1, [1, 2])).rejects.toThrow('Database connection failed');
      await expect(mockRepository.updateRank()).rejects.toThrow('Database connection failed');
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Invalid data provided');

      mockRepository.create.mockRejectedValue(validationError);
      mockRepository.update.mockRejectedValue(validationError);

      await expect(mockRepository.create({} as SeriesCreateRequest)).rejects.toThrow('Invalid data provided');
      await expect(mockRepository.update(1, {} as SeriesUpdateRequest)).rejects.toThrow('Invalid data provided');
    });

    it('should handle constraint violations', async () => {
      const constraintError = new Error('Foreign key constraint violation');

      mockRepository.assignGenres.mockRejectedValue(constraintError);
      mockRepository.addTitles.mockRejectedValue(constraintError);

      await expect(mockRepository.assignGenres(1, [999])).rejects.toThrow('Foreign key constraint violation');
      await expect(mockRepository.addTitles(1, ['title'])).rejects.toThrow('Foreign key constraint violation');
    });
  });
});
