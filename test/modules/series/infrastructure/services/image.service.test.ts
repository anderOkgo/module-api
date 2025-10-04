import { ImageService } from '../../../../../src/modules/series/infrastructure/services/image.service';
import { SeriesImageProcessorService } from '../../../../../src/modules/series/infrastructure/services/image-processor.service';

describe('ImageService', () => {
  let imageService: ImageService;
  let mockImageProcessor: jest.Mocked<SeriesImageProcessorService>;

  beforeEach(() => {
    mockImageProcessor = {
      processAndSaveImage: jest.fn(),
      deleteImage: jest.fn(),
    } as any;

    imageService = new ImageService(mockImageProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processAndSaveImage', () => {
    it('should delegate to image processor successfully', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const expectedPath = '/img/tarjeta/1.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await imageService.processAndSaveImage(imageBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
      expect(result).toBe(expectedPath);
    });

    it('should handle different series IDs', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const testCases = [1, 123, 9999, 999999999];

      for (const seriesId of testCases) {
        const expectedPath = `/img/tarjeta/${seriesId}.jpg`;
        mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

        const result = await imageService.processAndSaveImage(imageBuffer, seriesId);

        expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
        expect(result).toBe(expectedPath);
      }

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(testCases.length);
    });

    it('should handle different image buffer sizes', async () => {
      const smallBuffer = Buffer.from('small');
      const largeBuffer = Buffer.alloc(1024, 'large'); // 1KB buffer instead of 1MB
      const seriesId = 1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/img/tarjeta/1.jpg');

      await imageService.processAndSaveImage(smallBuffer, seriesId);
      await imageService.processAndSaveImage(largeBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(smallBuffer, seriesId);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(largeBuffer, seriesId);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(2);
    });

    it('should propagate image processor errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const error = new Error('Image processing failed');

      mockImageProcessor.processAndSaveImage.mockRejectedValue(error);

      await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(
        'Image processing failed'
      );
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
    });

    it('should handle optimization errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const error = new Error('Image optimization failed');

      mockImageProcessor.processAndSaveImage.mockRejectedValue(error);

      await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(
        'Image optimization failed'
      );
    });

    it('should handle save errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const error = new Error('Save operation failed');

      mockImageProcessor.processAndSaveImage.mockRejectedValue(error);

      await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(
        'Save operation failed'
      );
    });

    it('should handle empty image buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const seriesId = 1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/img/tarjeta/1.jpg');

      const result = await imageService.processAndSaveImage(emptyBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(emptyBuffer, seriesId);
      expect(result).toBe('/img/tarjeta/1.jpg');
    });

    it('should handle zero and negative series IDs', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const testCases = [0, -1, -999];

      for (const seriesId of testCases) {
        const expectedPath = `/img/tarjeta/${seriesId}.jpg`;
        mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

        const result = await imageService.processAndSaveImage(imageBuffer, seriesId);

        expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
        expect(result).toBe(expectedPath);
      }
    });
  });

  describe('deleteImage', () => {
    it('should delegate to image processor successfully', async () => {
      const imagePath = '/img/tarjeta/123.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(imagePath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });

    it('should handle different image path formats', async () => {
      const paths = [
        '/img/tarjeta/1.jpg',
        '/img/tarjeta/123.png',
        '/img/tarjeta/9999.gif',
        '/img/tarjeta/123456.webp',
      ];

      mockImageProcessor.deleteImage.mockResolvedValue();

      for (const imagePath of paths) {
        await imageService.deleteImage(imagePath);
        expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
      }

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(paths.length);
    });

    it('should propagate image processor errors', async () => {
      const imagePath = '/img/tarjeta/123.jpg';
      const error = new Error('File not found');

      mockImageProcessor.deleteImage.mockRejectedValue(error);

      await expect(imageService.deleteImage(imagePath)).rejects.toThrow('File not found');
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });

    it('should handle delete errors', async () => {
      const imagePath = '/img/tarjeta/123.jpg';
      const error = new Error('Permission denied');

      mockImageProcessor.deleteImage.mockRejectedValue(error);

      await expect(imageService.deleteImage(imagePath)).rejects.toThrow('Permission denied');
    });

    it('should handle paths with special characters', async () => {
      const specialPaths = [
        '/img/tarjeta/image with spaces.jpg',
        '/img/tarjeta/image-with-dashes.png',
        '/img/tarjeta/image_with_underscores.gif',
        '/img/tarjeta/image.with.dots.webp',
        '/img/tarjeta/image(with)parentheses.jpeg',
      ];

      mockImageProcessor.deleteImage.mockResolvedValue();

      for (const imagePath of specialPaths) {
        await imageService.deleteImage(imagePath);
        expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
      }

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(specialPaths.length);
    });

    it('should handle unicode characters in paths', async () => {
      const unicodePath = '/img/tarjeta/imagen-con-ñ-y-émojis-🎌.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(unicodePath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(unicodePath);
    });

    it('should handle empty path', async () => {
      const emptyPath = '';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(emptyPath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(emptyPath);
    });
  });

  describe('Edge cases', () => {
    it('should handle concurrent operations', async () => {
      const imageBuffer1 = Buffer.from('image-data-1');
      const imageBuffer2 = Buffer.from('image-data-2');
      const seriesId1 = 1;
      const seriesId2 = 2;
      const imagePath = '/img/tarjeta/1.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/img/tarjeta/1.jpg');
      mockImageProcessor.deleteImage.mockResolvedValue();

      const [result1, result2] = await Promise.all([
        imageService.processAndSaveImage(imageBuffer1, seriesId1),
        imageService.processAndSaveImage(imageBuffer2, seriesId2),
      ]);

      expect(result1).toBe('/img/tarjeta/1.jpg');
      expect(result2).toBe('/img/tarjeta/1.jpg');
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed operations', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const imagePath = '/img/tarjeta/1.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(imagePath);
      mockImageProcessor.deleteImage.mockResolvedValue();

      const saveResult = await imageService.processAndSaveImage(imageBuffer, seriesId);
      await imageService.deleteImage(saveResult);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(saveResult);
      expect(saveResult).toBe(imagePath);
    });

    it('should handle very large series IDs', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const largeSeriesId = 999999999;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/img/tarjeta/999999999.jpg');

      const result = await imageService.processAndSaveImage(imageBuffer, largeSeriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, largeSeriesId);
      expect(result).toBe('/img/tarjeta/999999999.jpg');
    });

    it('should handle very long image paths', async () => {
      const longPath = '/very/long/path/with/many/directories/and/subdirectories/images/series/1/image.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(longPath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(longPath);
    });
  });

  describe('Service delegation', () => {
    it('should be a simple pass-through for processAndSaveImage', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const expectedPath = '/img/tarjeta/1.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await imageService.processAndSaveImage(imageBuffer, seriesId);

      expect(result).toBe(expectedPath);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(1);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
    });

    it('should be a simple pass-through for deleteImage', async () => {
      const imagePath = '/img/tarjeta/123.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(imagePath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(1);
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });

    it('should maintain the same interface as the processor', async () => {
      // This test ensures that the service maintains the same interface
      // as the underlying processor without adding extra logic
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const imagePath = '/img/tarjeta/1.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/img/tarjeta/1.jpg');
      mockImageProcessor.deleteImage.mockResolvedValue();

      const processResult = await imageService.processAndSaveImage(imageBuffer, seriesId);
      await imageService.deleteImage(imagePath);

      expect(processResult).toBeDefined();
      expect(typeof processResult).toBe('string');
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });
  });
});
