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

const mockImageService: jest.Mocked<ImageService> = {
  processAndSaveImage: jest.fn(),
};

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
      mockSeriesWriteRepository.updateImage.mockResolvedValue();
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
  });
});
