import { SeriesImageProcessorService } from '../../../../../src/modules/series/infrastructure/services/image-processor.service';
import { ImageProcessor } from '../../../../../src/infrastructure/services/image';
import path from 'path';

// Mock the ImageProcessor
jest.mock('../../../../../src/infrastructure/services/image');

const MockedImageProcessor = ImageProcessor as jest.Mocked<typeof ImageProcessor>;

describe('SeriesImageProcessorService', () => {
  let imageProcessorService: SeriesImageProcessorService;

  beforeEach(() => {
    imageProcessorService = new SeriesImageProcessorService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processAndSaveImage', () => {
    it('should process and save image successfully', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const filename = '1.jpg';

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const result = await imageProcessorService.processAndSaveImage(imageBuffer, seriesId);

      expect(MockedImageProcessor.optimizeImage).toHaveBeenCalledWith(imageBuffer);
      expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledWith(
        optimizedBuffer,
        filename,
        expect.any(String)
      );
      expect(result).toBe('/img/tarjeta/1.jpg');
    });

    it('should handle different series IDs', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const uploadDir = '/test/app/uploads/series/img/tarjeta';

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const testCases = [1, 123, 9999, 999999999];

      for (const seriesId of testCases) {
        const result = await imageProcessorService.processAndSaveImage(imageBuffer, seriesId);
        expect(result).toBe(`/img/tarjeta/${seriesId}.jpg`);
        expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledWith(
          optimizedBuffer,
          `${seriesId}.jpg`,
          expect.any(String)
        );
      }
    });

    it('should handle different image buffer sizes', async () => {
      const smallBuffer = Buffer.from('small');
      const largeBuffer = Buffer.alloc(1024, 'large'); // 1KB buffer instead of 1MB
      const seriesId = 1;
      const optimizedBuffer = Buffer.from('optimized-image-data');

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      await imageProcessorService.processAndSaveImage(smallBuffer, seriesId);
      await imageProcessorService.processAndSaveImage(largeBuffer, seriesId);

      expect(MockedImageProcessor.optimizeImage).toHaveBeenCalledWith(smallBuffer);
      expect(MockedImageProcessor.optimizeImage).toHaveBeenCalledWith(largeBuffer);
      expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledTimes(2);
    });

    it('should handle optimization errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const error = new Error('Image optimization failed');

      MockedImageProcessor.optimizeImage.mockRejectedValue(error);

      await expect(imageProcessorService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(
        'Image optimization failed'
      );
      expect(MockedImageProcessor.saveOptimizedImage).not.toHaveBeenCalled();
    });

    it('should handle save errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const error = new Error('Save operation failed');

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockRejectedValue(error);

      await expect(imageProcessorService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(
        'Save operation failed'
      );
      expect(MockedImageProcessor.optimizeImage).toHaveBeenCalledWith(imageBuffer);
    });

    it('should always generate .jpg extension', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const seriesId = 12345;

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const result = await imageProcessorService.processAndSaveImage(imageBuffer, seriesId);

      expect(result).toBe('/img/tarjeta/12345.jpg');
      expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledWith(
        optimizedBuffer,
        '12345.jpg',
        expect.any(String)
      );
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const imagePath = '/img/tarjeta/123.jpg';
      const expectedPath = path.join(process.cwd(), 'uploads', 'series', imagePath);

      MockedImageProcessor.deleteImage = jest.fn().mockResolvedValue(undefined);

      await imageProcessorService.deleteImage(imagePath);

      expect(MockedImageProcessor.deleteImage).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle different image path formats', async () => {
      const paths = [
        '/img/tarjeta/1.jpg',
        '/img/tarjeta/123.png',
        '/img/tarjeta/9999.gif',
        '/img/tarjeta/123456.webp',
      ];

      MockedImageProcessor.deleteImage = jest.fn().mockResolvedValue(undefined);

      for (const imagePath of paths) {
        const expectedFullPath = path.join(process.cwd(), 'uploads', 'series', imagePath);

        await imageProcessorService.deleteImage(imagePath);

        expect(MockedImageProcessor.deleteImage).toHaveBeenCalledWith(expectedFullPath);
      }

      expect(MockedImageProcessor.deleteImage).toHaveBeenCalledTimes(paths.length);
    });

    it('should handle delete errors', async () => {
      const imagePath = '/img/tarjeta/123.jpg';
      const expectedPath = path.join(process.cwd(), 'uploads', 'series', imagePath);
      const error = new Error('File not found');

      MockedImageProcessor.deleteImage = jest.fn().mockRejectedValue(error);

      await expect(imageProcessorService.deleteImage(imagePath)).rejects.toThrow('File not found');
      expect(MockedImageProcessor.deleteImage).toHaveBeenCalledWith(expectedPath);
    });

    it('should handle when deleteImage is undefined', async () => {
      const imagePath = '/img/tarjeta/123.jpg';

      MockedImageProcessor.deleteImage = undefined as any;

      // Should not throw error when deleteImage is undefined
      await expect(imageProcessorService.deleteImage(imagePath)).resolves.toBeUndefined();
    });

    it('should handle paths with special characters', async () => {
      const specialPaths = [
        '/img/tarjeta/image with spaces.jpg',
        '/img/tarjeta/image-with-dashes.png',
        '/img/tarjeta/image_with_underscores.gif',
        '/img/tarjeta/image.with.dots.webp',
      ];

      MockedImageProcessor.deleteImage = jest.fn().mockResolvedValue(undefined);

      for (const imagePath of specialPaths) {
        const expectedFullPath = path.join(process.cwd(), 'uploads', 'series', imagePath);

        await imageProcessorService.deleteImage(imagePath);

        expect(MockedImageProcessor.deleteImage).toHaveBeenCalledWith(expectedFullPath);
      }
    });

    it('should handle unicode characters in paths', async () => {
      const unicodePath = '/img/tarjeta/imagen-con-ñ-y-émojis-🎌.jpg';
      const expectedPath = path.join(process.cwd(), 'uploads', 'series', unicodePath);

      MockedImageProcessor.deleteImage = jest.fn().mockResolvedValue(undefined);

      await imageProcessorService.deleteImage(unicodePath);

      expect(MockedImageProcessor.deleteImage).toHaveBeenCalledWith(expectedPath);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero series ID', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 0;
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const uploadDir = '/test/app/uploads/series/img/tarjeta';

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const result = await imageProcessorService.processAndSaveImage(imageBuffer, seriesId);

      expect(result).toBe('/img/tarjeta/0.jpg');
      expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledWith(
        optimizedBuffer,
        '0.jpg',
        expect.any(String)
      );
    });

    it('should handle negative series ID', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = -1;
      const optimizedBuffer = Buffer.from('optimized-image-data');
      const uploadDir = '/test/app/uploads/series/img/tarjeta';

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const result = await imageProcessorService.processAndSaveImage(imageBuffer, seriesId);

      expect(result).toBe('/img/tarjeta/-1.jpg');
      expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledWith(
        optimizedBuffer,
        '-1.jpg',
        expect.any(String)
      );
    });

    it('should handle empty image buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const seriesId = 1;
      const optimizedBuffer = Buffer.from('optimized-image-data');

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const result = await imageProcessorService.processAndSaveImage(emptyBuffer, seriesId);

      expect(MockedImageProcessor.optimizeImage).toHaveBeenCalledWith(emptyBuffer);
      expect(result).toBe('/img/tarjeta/1.jpg');
    });

    it('should handle concurrent operations', async () => {
      const imageBuffer1 = Buffer.from('image-data-1');
      const imageBuffer2 = Buffer.from('image-data-2');
      const seriesId1 = 1;
      const seriesId2 = 2;
      const optimizedBuffer = Buffer.from('optimized-image-data');

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');

      const [result1, result2] = await Promise.all([
        imageProcessorService.processAndSaveImage(imageBuffer1, seriesId1),
        imageProcessorService.processAndSaveImage(imageBuffer2, seriesId2),
      ]);

      expect(result1).toBe('/img/tarjeta/1.jpg');
      expect(result2).toBe('/img/tarjeta/2.jpg');
      expect(MockedImageProcessor.optimizeImage).toHaveBeenCalledTimes(2);
      expect(MockedImageProcessor.saveOptimizedImage).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed operations', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const imagePath = '/img/tarjeta/1.jpg';
      const optimizedBuffer = Buffer.from('optimized-image-data');

      MockedImageProcessor.optimizeImage.mockResolvedValue(optimizedBuffer);
      MockedImageProcessor.saveOptimizedImage.mockResolvedValue('/path/to/saved/image.jpg');
      MockedImageProcessor.deleteImage = jest.fn().mockResolvedValue(undefined);

      const saveResult = await imageProcessorService.processAndSaveImage(imageBuffer, seriesId);
      await imageProcessorService.deleteImage(saveResult);

      expect(saveResult).toBe('/img/tarjeta/1.jpg');
      expect(MockedImageProcessor.deleteImage).toHaveBeenCalledWith(
        path.join(process.cwd(), 'uploads', 'series', '/img/tarjeta/1.jpg')
      );
    });
  });
});
