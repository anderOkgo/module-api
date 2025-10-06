// Final comprehensive test file for image.ts with 100% coverage focus
import { ImageProcessor, ImageOptimizationOptions } from '../../../src/infrastructure/services/image';

// Mock sharp
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toBuffer: jest.fn(),
    metadata: jest.fn(),
  }));

  (mockSharp as any).kernel = { lanczos3: 'lanczos3' };
  return mockSharp;
});

// Mock fs operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFile: jest.fn(),
  unlink: jest.fn(),
}));

// Mock path operations
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  extname: jest.fn(),
  basename: jest.fn(),
}));

// Mock util.promisify
jest.mock('util', () => ({
  promisify: jest.fn(() => jest.fn().mockResolvedValue(undefined)),
}));

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const mockSharp = sharp as jest.MockedFunction<typeof sharp>;
const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('ImageProcessor - Final Coverage Tests', () => {
  let mockBuffer: Buffer;
  let mockSharpInstance: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockBuffer = Buffer.from('test-image-data');

    mockSharpInstance = {
      resize: jest.fn().mockReturnThis(),
      jpeg: jest.fn().mockReturnThis(),
      toBuffer: jest.fn(),
      metadata: jest.fn(),
    };

    mockSharp.mockReturnValue(mockSharpInstance);

    // Setup default mocks
    mockFs.existsSync = jest.fn();
    mockFs.mkdirSync = jest.fn();
    (mockFs.writeFile as any) = jest.fn().mockResolvedValue(undefined);
    (mockFs.unlink as any) = jest.fn().mockResolvedValue(undefined);

    mockPath.join = jest.fn((...args) => args.join('/'));
    mockPath.extname = jest.fn();
    mockPath.basename = jest.fn();
  });

  describe('optimizeImage', () => {
    it('should optimize image with default options', async () => {
      const expectedBuffer = Buffer.from('optimized');
      mockSharpInstance.toBuffer.mockResolvedValue(expectedBuffer);

      const result = await ImageProcessor.optimizeImage(mockBuffer);

      expect(result).toBe(expectedBuffer);
      expect(mockSharp).toHaveBeenCalledWith(mockBuffer);
    });

    it('should optimize image with custom options', async () => {
      const customOptions: Partial<ImageOptimizationOptions> = {
        width: 100,
        height: 150,
        quality: 80,
        maxSizeKB: 15,
      };
      const expectedBuffer = Buffer.from('optimized');
      mockSharpInstance.toBuffer.mockResolvedValue(expectedBuffer);

      const result = await ImageProcessor.optimizeImage(mockBuffer, customOptions);

      expect(result).toBe(expectedBuffer);
      expect(mockSharpInstance.resize).toHaveBeenCalledWith(100, 150, {
        fit: 'cover',
        position: 'center',
      });
    });

    it('should handle quality reduction when image is too large', async () => {
      // Create a buffer that simulates a large image
      const largeBuffer = Buffer.from('large-image-data');
      Object.defineProperty(largeBuffer, 'length', { value: 25000 }); // 24.4 KB

      const smallBuffer = Buffer.from('small-image-data');
      Object.defineProperty(smallBuffer, 'length', { value: 15000 }); // 14.6 KB

      // Mock sequence: large buffer, then small buffer
      mockSharpInstance.toBuffer
        .mockResolvedValueOnce(largeBuffer) // Initial call
        .mockResolvedValueOnce(smallBuffer); // After quality reduction

      const result = await ImageProcessor.optimizeImage(mockBuffer, { maxSizeKB: 20 });

      expect(result).toBe(smallBuffer);
      expect(mockSharpInstance.jpeg).toHaveBeenCalledTimes(2);
    });

    it('should handle optimization errors', async () => {
      const error = new Error('Sharp processing failed');
      mockSharpInstance.toBuffer.mockRejectedValue(error);

      await expect(ImageProcessor.optimizeImage(mockBuffer)).rejects.toThrow(
        'Error optimizing image: Sharp processing failed'
      );
    });

    it('should handle non-Error objects in optimization', async () => {
      mockSharpInstance.toBuffer.mockRejectedValue('String error');

      await expect(ImageProcessor.optimizeImage(mockBuffer)).rejects.toThrow(
        'Error optimizing image: Unknown error'
      );
    });
  });

  describe('optimizeImageAdvanced', () => {
    it('should optimize image with advanced options', async () => {
      const expectedBuffer = Buffer.from('advanced-optimized');
      const metadata = { width: 1920, height: 1080, format: 'jpeg' };

      mockSharpInstance.metadata.mockResolvedValue(metadata);
      mockSharpInstance.toBuffer.mockResolvedValue(expectedBuffer);

      const result = await ImageProcessor.optimizeImageAdvanced(mockBuffer);

      expect(result).toBe(expectedBuffer);
      expect(mockSharpInstance.metadata).toHaveBeenCalled();
    });

    it('should handle advanced optimization errors', async () => {
      const error = new Error('Advanced processing failed');
      mockSharpInstance.metadata.mockRejectedValue(error);

      await expect(ImageProcessor.optimizeImageAdvanced(mockBuffer)).rejects.toThrow(
        'Error in advanced image optimization: Advanced processing failed'
      );
    });

    it('should handle non-Error objects in advanced optimization', async () => {
      mockSharpInstance.metadata.mockRejectedValue('String error');

      await expect(ImageProcessor.optimizeImageAdvanced(mockBuffer)).rejects.toThrow(
        'Error in advanced image optimization: Unknown error'
      );
    });
  });

  describe('saveOptimizedImage', () => {
    it('should save image to existing directory', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockPath.join.mockReturnValue('/uploads/test.jpg');

      const result = await ImageProcessor.saveOptimizedImage(mockBuffer, 'test.jpg', '/uploads');

      expect(result).toBe('/uploads/test.jpg');
      expect(mockFs.existsSync).toHaveBeenCalledWith('/uploads');
    });

    it('should create directory if it does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockPath.join.mockReturnValue('/uploads/test.jpg');

      const result = await ImageProcessor.saveOptimizedImage(mockBuffer, 'test.jpg', '/uploads');

      expect(result).toBe('/uploads/test.jpg');
      expect(mockFs.mkdirSync).toHaveBeenCalledWith('/uploads', { recursive: true });
    });
  });

  describe('deleteImage', () => {
    it('should delete existing image file', async () => {
      mockFs.existsSync.mockReturnValue(true);

      await ImageProcessor.deleteImage('/uploads/test.jpg');

      expect(mockFs.existsSync).toHaveBeenCalledWith('/uploads/test.jpg');
    });

    it('should not delete if file does not exist', async () => {
      mockFs.existsSync.mockReturnValue(false);

      await ImageProcessor.deleteImage('/uploads/nonexistent.jpg');

      expect(mockFs.existsSync).toHaveBeenCalledWith('/uploads/nonexistent.jpg');
    });
  });

  describe('generateUniqueFilename', () => {
    it('should generate unique filename with timestamp', () => {
      mockPath.extname.mockReturnValue('.jpg');
      mockPath.basename.mockReturnValue('test-image');

      const result = ImageProcessor.generateUniqueFilename('test-image.jpg');

      expect(result).toMatch(/^test_image_\d+\.jpg$/);
      expect(mockPath.extname).toHaveBeenCalledWith('test-image.jpg');
      expect(mockPath.basename).toHaveBeenCalledWith('test-image.jpg', '.jpg');
    });

    it('should sanitize special characters in filename', () => {
      mockPath.extname.mockReturnValue('.jpg');
      mockPath.basename.mockReturnValue('test image (1)');

      const result = ImageProcessor.generateUniqueFilename('test image (1).jpg');

      expect(result).toMatch(/^test_image__1__\d+\.jpg$/);
    });

    it('should handle filenames without extension', () => {
      mockPath.extname.mockReturnValue('');
      mockPath.basename.mockReturnValue('test-image');

      const result = ImageProcessor.generateUniqueFilename('test-image');

      expect(result).toMatch(/^test_image_\d+$/);
    });
  });

  describe('isValidImageType', () => {
    it('should return true for valid image types', () => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

      validTypes.forEach((type) => {
        expect(ImageProcessor.isValidImageType(type)).toBe(true);
      });
    });

    it('should return false for invalid image types', () => {
      const invalidTypes = ['image/gif', 'text/plain', 'application/pdf', 'video/mp4'];

      invalidTypes.forEach((type) => {
        expect(ImageProcessor.isValidImageType(type)).toBe(false);
      });
    });

    it('should return false for empty or undefined types', () => {
      expect(ImageProcessor.isValidImageType('')).toBe(false);
      expect(ImageProcessor.isValidImageType(undefined as any)).toBe(false);
      expect(ImageProcessor.isValidImageType(null as any)).toBe(false);
    });
  });

  describe('getImageInfo', () => {
    it('should return image information', async () => {
      const metadata = {
        width: 1920,
        height: 1080,
        format: 'jpeg',
      };
      mockSharpInstance.metadata.mockResolvedValue(metadata);

      const result = await ImageProcessor.getImageInfo(mockBuffer);

      expect(result).toEqual({
        width: 1920,
        height: 1080,
        size: mockBuffer.length,
        format: 'jpeg',
      });
    });

    it('should handle missing metadata values', async () => {
      const metadata = {
        width: undefined,
        height: undefined,
        format: undefined,
      };
      mockSharpInstance.metadata.mockResolvedValue(metadata);

      const result = await ImageProcessor.getImageInfo(mockBuffer);

      expect(result).toEqual({
        width: 0,
        height: 0,
        size: mockBuffer.length,
        format: 'unknown',
      });
    });

    it('should handle getImageInfo errors', async () => {
      const error = new Error('Metadata extraction failed');
      mockSharpInstance.metadata.mockRejectedValue(error);

      await expect(ImageProcessor.getImageInfo(mockBuffer)).rejects.toThrow(
        'Error getting image info: Metadata extraction failed'
      );
    });

    it('should handle non-Error objects in getImageInfo', async () => {
      mockSharpInstance.metadata.mockRejectedValue('String error');

      await expect(ImageProcessor.getImageInfo(mockBuffer)).rejects.toThrow(
        'Error getting image info: Unknown error'
      );
    });

    it('should handle quality reduction in optimizeImage', async () => {
      // Test quality reduction logic
      const largeBuffer = Buffer.from('large-image-data');
      Object.defineProperty(largeBuffer, 'length', { value: 25000 });

      const smallBuffer = Buffer.from('small-image-data');
      Object.defineProperty(smallBuffer, 'length', { value: 15000 });

      // Mock sequence: large buffer, then small buffer
      mockSharpInstance.toBuffer
        .mockResolvedValueOnce(largeBuffer) // Initial call
        .mockResolvedValueOnce(smallBuffer); // After quality reduction

      const result = await ImageProcessor.optimizeImage(mockBuffer, {
        maxSizeKB: 20,
        quality: 90,
      });

      expect(result).toBe(smallBuffer);
      expect(mockSharpInstance.jpeg).toHaveBeenCalledTimes(2);
    });

    it('should handle advanced optimization with quality steps', async () => {
      // Test advanced optimization logic
      const largeBuffer = Buffer.from('large-image-data');
      const mediumBuffer = Buffer.from('medium-image-data');
      const smallBuffer = Buffer.from('small-image-data');

      Object.defineProperty(largeBuffer, 'length', { value: 25000 });
      Object.defineProperty(mediumBuffer, 'length', { value: 18000 });
      Object.defineProperty(smallBuffer, 'length', { value: 15000 });

      const metadata = { width: 1920, height: 1080, format: 'jpeg' };
      mockSharpInstance.metadata.mockResolvedValue(metadata);

      // Mock sequence - initial large, then medium (acceptable size)
      mockSharpInstance.toBuffer
        .mockResolvedValueOnce(largeBuffer) // Initial optimization
        .mockResolvedValueOnce(mediumBuffer); // First quality step

      const result = await ImageProcessor.optimizeImageAdvanced(mockBuffer, {
        maxSizeKB: 20,
        quality: 90,
      });

      expect(result).toBe(mediumBuffer);
      expect(mockSharpInstance.metadata).toHaveBeenCalled();
    });
  });
});
