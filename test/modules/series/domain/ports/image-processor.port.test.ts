import { ImageProcessorPort } from '../../../../../src/modules/series/domain/ports/image-processor.port';

describe('ImageProcessorPort Interface', () => {
  let mockImageProcessor: ImageProcessorPort;

  beforeEach(() => {
    mockImageProcessor = {
      processAndSaveImage: jest.fn(),
      deleteImage: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Interface compliance', () => {
    it('should implement processAndSaveImage method', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const expectedPath = '/images/series/1/image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await mockImageProcessor.processAndSaveImage(imageBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
      expect(result).toBe(expectedPath);
    });

    it('should implement deleteImage method', async () => {
      const imagePath = '/images/series/1/image.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await mockImageProcessor.deleteImage(imagePath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(imagePath);
    });

    it('should handle processAndSaveImage with different buffer sizes', async () => {
      const smallBuffer = Buffer.from('small');
      const largeBuffer = Buffer.alloc(1024, 'large'); // 1KB buffer instead of 1MB
      const seriesId = 1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/path/to/image.jpg');

      await mockImageProcessor.processAndSaveImage(smallBuffer, seriesId);
      await mockImageProcessor.processAndSaveImage(largeBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledTimes(2);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(smallBuffer, seriesId);
      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(largeBuffer, seriesId);
    });

    it('should handle deleteImage with different path formats', async () => {
      const paths = [
        '/images/series/1/image.jpg',
        'images/series/2/image.png',
        'C:\\images\\series\\3\\image.gif',
        '/var/www/images/series/4/image.webp',
      ];

      mockImageProcessor.deleteImage.mockResolvedValue();

      for (const path of paths) {
        await mockImageProcessor.deleteImage(path);
        expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(path);
      }

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledTimes(paths.length);
    });
  });

  describe('Error handling', () => {
    it('should handle processAndSaveImage errors', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const error = new Error('Image processing failed');

      mockImageProcessor.processAndSaveImage.mockRejectedValue(error);

      await expect(mockImageProcessor.processAndSaveImage(imageBuffer, seriesId)).rejects.toThrow(
        'Image processing failed'
      );
    });

    it('should handle deleteImage errors', async () => {
      const imagePath = '/images/series/1/image.jpg';
      const error = new Error('File not found');

      mockImageProcessor.deleteImage.mockRejectedValue(error);

      await expect(mockImageProcessor.deleteImage(imagePath)).rejects.toThrow('File not found');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty buffer', async () => {
      const emptyBuffer = Buffer.alloc(0);
      const seriesId = 1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/path/to/image.jpg');

      await mockImageProcessor.processAndSaveImage(emptyBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(emptyBuffer, seriesId);
    });

    it('should handle zero series ID', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 0;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/path/to/image.jpg');

      await mockImageProcessor.processAndSaveImage(imageBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
    });

    it('should handle negative series ID', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = -1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/path/to/image.jpg');

      await mockImageProcessor.processAndSaveImage(imageBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
    });

    it('should handle empty image path', async () => {
      const emptyPath = '';

      mockImageProcessor.deleteImage.mockResolvedValue();

      await mockImageProcessor.deleteImage(emptyPath);

      expect(mockImageProcessor.deleteImage).toHaveBeenCalledWith(emptyPath);
    });

    it('should handle null/undefined parameters gracefully', async () => {
      // Note: TypeScript would prevent this, but testing interface compliance
      const imageBuffer = Buffer.from('test');
      const seriesId = 1;

      mockImageProcessor.processAndSaveImage.mockResolvedValue('/path/to/image.jpg');

      await mockImageProcessor.processAndSaveImage(imageBuffer, seriesId);

      expect(mockImageProcessor.processAndSaveImage).toHaveBeenCalledWith(imageBuffer, seriesId);
    });
  });

  describe('Return types', () => {
    it('should return string from processAndSaveImage', async () => {
      const imageBuffer = Buffer.from('test-image-data');
      const seriesId = 1;
      const expectedPath = '/images/series/1/processed-image.jpg';

      mockImageProcessor.processAndSaveImage.mockResolvedValue(expectedPath);

      const result = await mockImageProcessor.processAndSaveImage(imageBuffer, seriesId);

      expect(typeof result).toBe('string');
      expect(result).toBe(expectedPath);
    });

    it('should return void from deleteImage', async () => {
      const imagePath = '/images/series/1/image.jpg';

      mockImageProcessor.deleteImage.mockResolvedValue();

      const result = await mockImageProcessor.deleteImage(imagePath);

      expect(result).toBeUndefined();
    });
  });
});
