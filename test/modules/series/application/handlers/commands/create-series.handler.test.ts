import { CreateSeriesHandler } from '../../../../../../src/modules/series/application/handlers/commands/create-series.handler';
import { CreateSeriesCommand } from '../../../../../../src/modules/series/application/commands/create-series.command';
import { SeriesWriteRepository } from '../../../../../../src/modules/series/application/ports/series-write.repository';
import { ImageService } from '../../../../../../src/modules/series/application/services/image.service';

// Mock dependencies
const mockSeriesWriteRepository: jest.Mocked<SeriesWriteRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  assignGenres: jest.fn(),
  removeGenres: jest.fn(),
  addTitles: jest.fn(),
  removeTitles: jest.fn(),
  updateImage: jest.fn(),
  updateRank: jest.fn(),
};

const mockImageService = {
  processAndSaveImage: jest.fn(),
  deleteImage: jest.fn(),
} as any;

describe('CreateSeriesHandler', () => {
  let createSeriesHandler: CreateSeriesHandler;

  beforeEach(() => {
    createSeriesHandler = new CreateSeriesHandler(mockSeriesWriteRepository, mockImageService);
    jest.clearAllMocks();
  });

  describe('execute', () => {
    const validCommand = new CreateSeriesCommand(
      'Test Series',
      12,
      2023,
      'Test description',
      'Test description EN',
      8.5,
      1,
      true,
      Buffer.from('fake-image-data')
    );

    it('should create series successfully with image', async () => {
      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'processed-image-data',
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockImageService.processAndSaveImage.mockResolvedValue('processed-image-data');
      mockSeriesWriteRepository.updateImage.mockResolvedValue(true);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(validCommand);

      expect(result).toEqual(createdSeries);
      expect(mockImageService.processAndSaveImage).toHaveBeenCalledWith(Buffer.from('fake-image-data'), 1);
      expect(mockSeriesWriteRepository.updateImage).toHaveBeenCalledWith(1, 'processed-image-data');
      expect(mockSeriesWriteRepository.updateRank).toHaveBeenCalled();
    });

    it('should create series successfully without image', async () => {
      const commandWithoutImage = new CreateSeriesCommand(
        'Test Series',
        12,
        2023,
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(commandWithoutImage);

      expect(result).toEqual(createdSeries);
      expect(mockImageService.processAndSaveImage).not.toHaveBeenCalled();
      expect(mockSeriesWriteRepository.updateImage).not.toHaveBeenCalled();
      expect(mockSeriesWriteRepository.updateRank).toHaveBeenCalled();
    });

    it('should throw error when repository create fails', async () => {
      mockSeriesWriteRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(createSeriesHandler.execute(validCommand)).rejects.toThrow('Database error');

      expect(mockSeriesWriteRepository.create).toHaveBeenCalled();
    });

    it('should handle command with minimal required fields', async () => {
      const minimalCommand = new CreateSeriesCommand('Minimal Series', 1, 2020, '', '', 0, 1, false, undefined);

      const createdSeries = {
        id: 1,
        name: 'Minimal Series',
        chapter_number: 1,
        year: 2020,
        description: '',
        description_en: '',
        qualification: 0,
        demography_id: 1,
        visible: false,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(minimalCommand);

      expect(result).toEqual(createdSeries);
      expect(mockSeriesWriteRepository.updateRank).toHaveBeenCalled();
    });

    it('should throw error for name too long', async () => {
      const maxCommand = new CreateSeriesCommand(
        'A'.repeat(201), // Name too long (over 200 chars)
        999999,
        2099,
        'A'.repeat(1000), // Long description
        'A'.repeat(1000), // Long description EN
        10,
        999,
        true,
        Buffer.from('large-image-data')
      );

      await expect(createSeriesHandler.execute(maxCommand)).rejects.toThrow(
        'Series name must not exceed 200 characters'
      );
    });

    it('should throw error for name too short', async () => {
      const shortNameCommand = new CreateSeriesCommand(
        'A', // Name too short (1 char)
        1,
        2023,
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(shortNameCommand)).rejects.toThrow(
        'Series name must be at least 2 characters'
      );
    });

    it('should throw error for empty name', async () => {
      const emptyNameCommand = new CreateSeriesCommand(
        '', // Empty name
        1,
        2023,
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(emptyNameCommand)).rejects.toThrow(
        'Series name must be at least 2 characters'
      );
    });

    it('should throw error for whitespace-only name', async () => {
      const whitespaceNameCommand = new CreateSeriesCommand(
        '   ', // Whitespace only
        1,
        2023,
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(whitespaceNameCommand)).rejects.toThrow(
        'Series name must be at least 2 characters'
      );
    });

    it('should throw error for negative chapter number', async () => {
      const negativeChapterCommand = new CreateSeriesCommand(
        'Test Series',
        -1, // Negative chapter
        2023,
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(negativeChapterCommand)).rejects.toThrow(
        'Chapter number must be positive'
      );
    });

    it('should throw error for year too early', async () => {
      const earlyYearCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        1899, // Year too early
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(earlyYearCommand)).rejects.toThrow('Year must be between 1900 and');
    });

    it('should throw error for year too far in future', async () => {
      const futureYear = new Date().getFullYear() + 6;
      const futureYearCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        futureYear, // Year too far in future
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(futureYearCommand)).rejects.toThrow(
        'Year must be between 1900 and'
      );
    });

    it('should throw error for negative qualification', async () => {
      const negativeQualCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'Test description',
        'Test description EN',
        -1, // Negative qualification
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(negativeQualCommand)).rejects.toThrow(
        'Qualification must be between 0 and 10'
      );
    });

    it('should throw error for qualification too high', async () => {
      const highQualCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'Test description',
        'Test description EN',
        11, // Qualification too high
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(highQualCommand)).rejects.toThrow(
        'Qualification must be between 0 and 10'
      );
    });

    it('should throw error for invalid demography_id (zero)', async () => {
      const invalidDemoCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'Test description',
        'Test description EN',
        8.5,
        0, // Invalid demography_id
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(invalidDemoCommand)).rejects.toThrow(
        'Valid demography_id is required'
      );
    });

    it('should throw error for negative demography_id', async () => {
      const negativeDemoCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'Test description',
        'Test description EN',
        8.5,
        -1, // Negative demography_id
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(negativeDemoCommand)).rejects.toThrow(
        'Valid demography_id is required'
      );
    });

    it('should throw error for description too long', async () => {
      const longDescCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'A'.repeat(5001), // Description too long
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(longDescCommand)).rejects.toThrow(
        'Description must not exceed 5000 characters'
      );
    });

    it('should throw error for description_en too long', async () => {
      const longDescEnCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'Test description',
        'A'.repeat(5001), // Description_en too long
        8.5,
        1,
        true,
        undefined
      );

      await expect(createSeriesHandler.execute(longDescEnCommand)).rejects.toThrow(
        'Description_en must not exceed 5000 characters'
      );
    });

    it('should handle image processing failure gracefully', async () => {
      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockImageService.processAndSaveImage.mockRejectedValue(new Error('Image processing failed'));
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      // Mock console.warn to avoid console output in tests
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await createSeriesHandler.execute(validCommand);

      expect(result).toEqual({
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Image processing failed for series 1:', expect.any(Error));
      expect(mockSeriesWriteRepository.updateImage).not.toHaveBeenCalled();
      expect(mockSeriesWriteRepository.updateRank).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle image processing failure with non-Error object', async () => {
      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockImageService.processAndSaveImage.mockRejectedValue('String error');
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await createSeriesHandler.execute(validCommand);

      expect(result).toEqual({
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      });
      expect(consoleSpy).toHaveBeenCalledWith('Image processing failed for series 1:', 'String error');

      consoleSpy.mockRestore();
    });

    it('should normalize data correctly', async () => {
      const commandWithWhitespace = new CreateSeriesCommand(
        '  Test Series  ', // Name with whitespace
        12,
        2023,
        '  Test description  ', // Description with whitespace
        '  Test description EN  ', // Description_en with whitespace
        8.5,
        1,
        true, // visible true
        Buffer.from('fake-image-data')
      );

      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'processed-image-data',
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockImageService.processAndSaveImage.mockResolvedValue('processed-image-data');
      mockSeriesWriteRepository.updateImage.mockResolvedValue(true);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(commandWithWhitespace);

      // Verify that create was called with normalized data
      expect(mockSeriesWriteRepository.create).toHaveBeenCalledWith({
        name: 'Test Series', // Trimmed
        chapter_number: 12,
        year: 2023,
        description: 'Test description', // Trimmed
        description_en: 'Test description EN', // Trimmed
        qualification: 8.5,
        demography_id: 1,
        visible: true, // Default to true when undefined
      });

      expect(result).toEqual({
        id: 1,
        name: 'Test Series', // Should return normalized name
        chapter_number: 12,
        year: 2023,
        description: 'Test description', // Should return normalized description
        description_en: 'Test description EN', // Should return normalized description_en
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'processed-image-data',
      });
    });

    it('should handle empty descriptions by converting to empty strings', async () => {
      const commandWithEmptyDescs = new CreateSeriesCommand(
        'Test Series',
        12,
        2023,
        '', // Empty description
        null as any, // Empty description_en
        8.5,
        1,
        false,
        undefined
      );

      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: '',
        description_en: '',
        qualification: 8.5,
        demography_id: 1,
        visible: false,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(commandWithEmptyDescs);

      expect(mockSeriesWriteRepository.create).toHaveBeenCalledWith({
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: '', // Should be converted to empty string
        description_en: '', // Should be converted to empty string
        qualification: 8.5,
        demography_id: 1,
        visible: false,
      });

      expect(result).toEqual(createdSeries);
    });

    it('should handle updateRank failure', async () => {
      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockSeriesWriteRepository.updateRank.mockRejectedValue(new Error('Rank update failed'));

      await expect(createSeriesHandler.execute(validCommand)).rejects.toThrow('Rank update failed');

      expect(mockSeriesWriteRepository.create).toHaveBeenCalled();
      expect(mockSeriesWriteRepository.updateRank).toHaveBeenCalled();
    });

    it('should handle updateImage failure during image processing', async () => {
      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockImageService.processAndSaveImage.mockResolvedValue('processed-image-data');
      mockSeriesWriteRepository.updateImage.mockRejectedValue(new Error('Database update failed'));
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = await createSeriesHandler.execute(validCommand);

      expect(result).toEqual({
        id: 1,
        name: 'Test Series',
        chapter_number: 12,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: 'processed-image-data', // Still returns the processed image path even if updateImage fails
      });

      expect(consoleSpy).toHaveBeenCalledWith('Image processing failed for series 1:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle edge case year values', async () => {
      const currentYear = new Date().getFullYear();
      const edgeYearCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        currentYear, // Current year should be valid
        'Test description',
        'Test description EN',
        8.5,
        1,
        true,
        undefined
      );

      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 1,
        year: currentYear,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 8.5,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(edgeYearCommand);

      expect(result).toEqual(createdSeries);
    });

    it('should handle edge case qualification values', async () => {
      const edgeQualCommand = new CreateSeriesCommand(
        'Test Series',
        1,
        2023,
        'Test description',
        'Test description EN',
        10, // Maximum valid qualification
        1,
        true,
        undefined
      );

      const createdSeries = {
        id: 1,
        name: 'Test Series',
        chapter_number: 1,
        year: 2023,
        description: 'Test description',
        description_en: 'Test description EN',
        qualification: 10,
        demography_id: 1,
        visible: true,
        image: undefined,
      };

      mockSeriesWriteRepository.create.mockResolvedValue(createdSeries);
      mockSeriesWriteRepository.updateRank.mockResolvedValue();

      const result = await createSeriesHandler.execute(edgeQualCommand);

      expect(result).toEqual(createdSeries);
    });
  });
});
