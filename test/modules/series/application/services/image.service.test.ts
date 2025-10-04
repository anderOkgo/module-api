import { ImageService } from '../../../../../src/modules/series/application/services/image.service';
import { ImageProcessorPort } from '../../../../../src/modules/series/domain/ports/image-processor.port';

describe('ImageService', () => {
  let imageService: ImageService;
  let mockImageProcessor: jest.Mocked<ImageProcessorPort>;

  beforeEach(() => {
    mockImageProcessor = {
      processAndSaveImage: jest.fn(),
      deleteImage: jest.fn(),
    };

    imageService = new ImageService(mockImageProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('processAndSaveImage', () => {
    it('should process and save image successfully', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const expectedPath = '/images/series/1/processed-image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await imageService.processAndSaveImage(imageBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
      expect(result).toBe(expectedPath);
    });

    it('should throw error when image buffer is null', async () => {
      const seriesId = 1;

      await expect(imageService.processAndSaveImage(null as any, seriesId)).rejects.toThrow('Image buffer is required');
      expect(mockImageProcessor.processAndSaveImage).not.toHaveBeenCalled();
    });

    it('should throw error when image buffer is undefined', async () => {
      const seriesId = 1;

      await expect(imageService.processAndSaveImage(undefined as any, seriesId)).rejects.toThrow('Image buffer is required');
      expect(mockImageProcessor.processAndSaveImage).not.toHaveBeenCalled();
    });

    it('should throw error when image buffer is empty', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const seriesId = 1;

      await expect(imageService.processAndSaveImage(emptyBuffer, seriesId)).rejects.toThrow('Image buffer is required');
      expect(mockImageProcessor.processAndSaveImage).not.toHaveBeenCalled();
    });

    it('should throw error when series ID is zero', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 0;

      await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow('Valid series ID is required');
      expect(mockImageProcessor.processAndSaveImage).not.toHaveBeenCalled();
    });

    it('should throw error when series ID is negative', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = -1;

      await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow('Valid series ID is required');
      expect(mockImageProcessor.processAndSaveImage).not.toHaveBeenCalled();
    });

    it('should handle image processor errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const error = new Error('Image processing failed');

      mockImageProcessor.processAndSaveImage.mockRejectedValue(error);

      await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow('Image processing failed');
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
    });

    it('should handle large image buffers', async () => {
      const largeBuffer = Buffer.alloc(1024 * 1024 * 10, 'large-image-data'); // 10MB buffer
      const seriesId = 1;
      const expectedPath = '/images/series/1/large-image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await imageService.processAndSaveImage(largeBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(largeBuffer, seriesId);
      expect(result).toBe(expectedPath);
    });

    it('should handle different image formats', async () => {
      const jpegBuffer = Buffer.from('jpeg-image-data');
      const pngBuffer = Buffer.from('png-image-data');
      const gifBuffer = Buffer.from('gif-image-data');
      const webpBuffer = Buffer.from('webp-image-data');
      const seriesId = 1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/images/series/1/image.jpg');

      await imageService.processAndSaveImage(jpegBuffer, seriesId);
      await imageService.processAndSaveImage(pngBuffer, seriesId);
      await imageService.processAndSaveImage(gifBuffer, seriesId);
      await imageService.processAndSaveImage(webpBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(4);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(jpegBuffer, seriesId);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(pngBuffer, seriesId);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(gifBuffer, seriesId);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(webpBuffer, seriesId);
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      const imagePath = '/images/series/1/image.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(imagePath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });

    it('should throw error when image path is null', async () => {
      await expect(imageService.deleteImage(null as any)).rejects.toThrow('Image path is required');
      expect(mockImageProcessor.deleteImage).not.toHaveBeenCalled();
    });

    it('should throw error when image path is undefined', async () => {
      await expect(imageService.deleteImage(undefined as any)).rejects.toThrow('Image path is required');
      expect(mockImageProcessor.deleteImage).not.toHaveBeenCalled();
    });

    it('should throw error when image path is empty string', async () => {
      const emptyPath = '';

      await expect(imageService.deleteImage(emptyPath)).rejects.toThrow('Image path is required');
      expect(mockImageProcessor.deleteImage).not.toHaveBeenCalled();
    });

    it('should throw error when image path is only whitespace', async () => {
      const whitespacePath = '   ';

      await expect(imageService.deleteImage(whitespacePath)).rejects.toThrow('Image path is required');
      expect(mockImageProcessor.deleteImage).not.toHaveBeenCalled();
    });

    it('should handle image processor errors', async () => {
      const imagePath = '/images/series/1/image.jpg';
      const error = new Error('File not found');

      mockImageProcessor.deleteImage.mockRejectedValue(error);

      await expect(imageService.deleteImage(imagePath)).rejects.toThrow('File not found');
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });

    it('should handle different path formats', async () => {
      const paths = [
        '/images/series/1/image.jpg',
        'images/series/2/image.png',
        'C:\\images\\series\\3\\image.gif',
        '/var/www/images/series/4/image.webp',
        'https://example.com/images/series/5/image.jpeg',
      ];

      mockImageProcessor.deleteImage.mockResolvedValue();

      for (const path of paths) {
        await imageService.deleteImage(path);
        expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(path);
      }

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(paths.length);
    });

    it('should handle paths with special characters', async () => {
      const specialPaths = [
        '/images/series/1/image with spaces.jpg',
        '/images/series/2/image-with-dashes.png',
        '/images/series/3/image_with_underscores.gif',
        '/images/series/4/image.with.dots.webp',
        '/images/series/5/image(with)parentheses.jpeg',
      ];

      mockImageProcessor.deleteImage.mockResolvedValue();

      for (const path of specialPaths) {
        await imageService.deleteImage(path);
        expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(path);
      }

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(specialPaths.length);
    });

    it('should handle unicode characters in paths', async () => {
      const unicodePath = '/images/series/1/imagen-con-ñ-y-émojis-🎌.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(unicodePath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(unicodePath);
    });
  });

  describe('Edge cases', () => {
    it('should handle very large series IDs', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const largeSeriesId = 999999999;
      const expectedPath = '/images/series/999999999/image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await imageService.processAndSaveImage(imageBuffer, largeSeriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, largeSeriesId);
      expect(result).toBe(expectedPath);
    });

    it('should handle very long image paths', async () => {
      const longPath = '/very/long/path/with/many/directories/and/subdirectories/images/series/1/image.jpg';
      const veryLongPath = '/a'.repeat(1000) + '/image.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await imageService.deleteImage(longPath);
      await imageService.deleteImage(veryLongPath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(longPath);
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(veryLongPath);
    });

    it('should handle concurrent operations', async () => {
      const imageBuffer1 = Buffer.from('image-data-1');
      const imageBuffer2 = Buffer.from('image-data-2');
      const seriesId1 = 1;
      const seriesId2 = 2;
      const imagePath = '/images/series/1/image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/images/series/1/image.jpg');
      mockImageProcessor.deleteImage.mockResolvedValue();

      const [result1, result2] = await Promise.all([
        imageService.processAndSaveImage(imageBuffer1, seriesId1),
        imageService.processAndSaveImage(imageBuffer2, seriesId2),
      ]);

      expect(result1).toBe('/images/series/1/image.jpg');
      expect(result2).toBe('/images/series/1/image.jpg');
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(2);
    });

    it('should handle mixed operations', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const imagePath = '/images/series/1/image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(imagePath);
      mockImageProcessor.deleteImage.mockResolvedValue();

      const saveResult = await imageService.processAndSaveImage(imageBuffer, seriesId);
      await imageService.deleteImage(saveResult);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(saveResult);
    });
  });

  describe('Error propagation', () => {
    it('should propagate specific error types', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;

      const specificErrors = [
        new Error('Network timeout'),
        new Error('Invalid image format'),
        new Error('Storage quota exceeded'),
        new Error('Permission denied'),
        new Error('Corrupted image data'),
      ];

      for (const error of specificErrors) {
        mockImageProcessor.processAndSaveImage.mockRejectedValueOnce(error);

        await expect(imageService.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(error.message);
      }

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(specificErrors.length);
    });

    it('should propagate specific delete errors', async () => {
      const imagePath = '/images/series/1/image.jpg';

      const specificErrors = [
        new Error('File not found'),
        new Error('Permission denied'),
        new Error('File is locked'),
        new Error('Directory not found'),
      ];

      for (const error of specificErrors) {
        mockImageProcessor.deleteImage.mockRejectedValueOnce(error);

        await expect(imageService.deleteImage(imagePath)).rejects.toThrow(error.message);
      }

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(specificErrors.length);
    });
  });
});
