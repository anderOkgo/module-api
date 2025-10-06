import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

export interface ImageOptimizationOptions {
  width: number;
  height: number;
  quality: number;
  maxSizeKB: number;
}

export class ImageProcessor {
  private static readonly DEFAULT_OPTIONS: ImageOptimizationOptions = {
    width: 190,
    height: 285,
    quality: 90,
    maxSizeKB: 20,
  };

  /**
   * Optimizes an image to the required specifications
   * @param inputBuffer Buffer of the original image
   * @param options Optimization options
   * @returns Optimized buffer
   */
  static async optimizeImage(
    inputBuffer: Buffer,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<Buffer> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      let optimizedBuffer = await sharp(inputBuffer)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({
          quality: config.quality,
          progressive: true,
          mozjpeg: true,
        })
        .toBuffer();

      // Check size and adjust quality if necessary
      let sizeKB = optimizedBuffer.length / 1024;

      if (sizeKB > config.maxSizeKB) {
        // Reduce quality more gradually to maintain better quality
        let quality = config.quality;
        let attempts = 0;
        const maxAttempts = 8; // Limit attempts to avoid infinite loops

        while (sizeKB > config.maxSizeKB && quality > 30 && attempts < maxAttempts) {
          // Reduce quality more gradually
          if (quality > 80) {
            quality -= 10; // Gentler reduction for high qualities
          } else if (quality > 60) {
            quality -= 8; // Medium reduction
          } else {
            quality -= 5; // More conservative reduction for low qualities
          }

          attempts++;

          optimizedBuffer = await sharp(inputBuffer)
            .resize(config.width, config.height, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({
              quality,
              progressive: true,
              mozjpeg: true,
            })
            .toBuffer();

          sizeKB = optimizedBuffer.length / 1024;
        }

        // If still too large, use more aggressive compression while maintaining minimum quality
        if (sizeKB > config.maxSizeKB && quality <= 30) {
          optimizedBuffer = await sharp(inputBuffer)
            .resize(config.width, config.height, {
              fit: 'cover',
              position: 'center',
            })
            .jpeg({
              quality: 30,
              progressive: true,
              mozjpeg: true,
              optimizeScans: true,
            })
            .toBuffer();
        }
      }

      return optimizedBuffer;
    } catch (error) {
      throw new Error(`Error optimizing image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Advanced optimization with multiple strategies
   * @param inputBuffer Buffer of the original image
   * @param options Optimization options
   * @returns Optimized buffer with better quality
   */
  static async optimizeImageAdvanced(
    inputBuffer: Buffer,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<Buffer> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Get metadata from the original image
      const metadata = await sharp(inputBuffer).metadata();
      const originalSize = inputBuffer.length;

      // Strategy 1: Initial optimization with high quality
      let optimizedBuffer = await sharp(inputBuffer)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3, // Better resizing algorithm
        })
        .jpeg({
          quality: config.quality,
          progressive: true,
          mozjpeg: true,
          optimizeScans: true,
          trellisQuantisation: true,
          overshootDeringing: true,
        })
        .toBuffer();

      let sizeKB = optimizedBuffer.length / 1024;

      // If size is acceptable, return
      if (sizeKB <= config.maxSizeKB) {
        return optimizedBuffer;
      }

      // Strategy 2: Gradual quality reduction
      let quality = config.quality;
      const qualitySteps = [85, 80, 75, 70, 65, 60, 55, 50, 45, 40, 35, 30];

      for (const targetQuality of qualitySteps) {
        if (targetQuality >= quality) continue;

        optimizedBuffer = await sharp(inputBuffer)
          .resize(config.width, config.height, {
            fit: 'cover',
            position: 'center',
            kernel: sharp.kernel.lanczos3,
          })
          .jpeg({
            quality: targetQuality,
            progressive: true,
            mozjpeg: true,
            optimizeScans: true,
            trellisQuantisation: true,
            overshootDeringing: true,
          })
          .toBuffer();

        sizeKB = optimizedBuffer.length / 1024;

        if (sizeKB <= config.maxSizeKB) {
          return optimizedBuffer;
        }
      }

      // Strategy 3: If still too large, use more aggressive compression
      if (sizeKB > config.maxSizeKB) {
        optimizedBuffer = await sharp(inputBuffer)
          .resize(config.width, config.height, {
            fit: 'cover',
            position: 'center',
            kernel: sharp.kernel.lanczos3,
          })
          .jpeg({
            quality: 30,
            progressive: true,
            mozjpeg: true,
            optimizeScans: true,
            trellisQuantisation: true,
            overshootDeringing: true,
            quantisationTable: 3, // Optimized quantization table
          })
          .toBuffer();
      }

      return optimizedBuffer;
    } catch (error) {
      throw new Error(
        `Error in advanced image optimization: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Saves an optimized image to the file system
   * @param buffer Buffer of the optimized image
   * @param filename File name
   * @param uploadPath Upload directory
   * @returns Path of the saved file
   */
  static async saveOptimizedImage(buffer: Buffer, filename: string, uploadPath: string): Promise<string> {
    try {
      // Create directory if it doesn't exist
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const filePath = path.join(uploadPath, filename);
      await writeFile(filePath, buffer as any);

      return filePath;
    } catch (error) {
      throw new Error(`Error saving image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deletes an image from the file system
   * @param filePath Path of the file to delete
   */
  static async deleteImage(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      throw new Error(`Error deleting image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates a unique filename
   * @param originalName Original file name
   * @returns Unique name with timestamp
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');

    return `${sanitizedName}_${timestamp}${extension}`;
  }

  /**
   * Validates the image file type
   * @param mimetype MIME type of the file
   * @returns true if it's a valid image type
   */
  static isValidImageType(mimetype: string): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype);
  }

  /**
   * Gets image information
   * @param buffer Image buffer
   * @returns Image information
   */
  static async getImageInfo(buffer: Buffer): Promise<{
    width: number;
    height: number;
    size: number;
    format: string;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        size: buffer.length,
        format: metadata.format || 'unknown',
      };
    } catch (error) {
      throw new Error(`Error getting image info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default ImageProcessor;
