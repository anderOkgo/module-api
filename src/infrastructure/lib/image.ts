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
   * Optimiza una imagen a las especificaciones requeridas
   * @param inputBuffer Buffer de la imagen original
   * @param options Opciones de optimización
   * @returns Buffer optimizado
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

      // Verificar tamaño y ajustar calidad si es necesario
      let sizeKB = optimizedBuffer.length / 1024;

      if (sizeKB > config.maxSizeKB) {
        // Reducir calidad de manera más gradual para mantener mejor calidad
        let quality = config.quality;
        let attempts = 0;
        const maxAttempts = 8; // Límite de intentos para evitar bucles infinitos

        while (sizeKB > config.maxSizeKB && quality > 30 && attempts < maxAttempts) {
          // Reducir calidad de manera más gradual
          if (quality > 80) {
            quality -= 10; // Reducción más suave para calidades altas
          } else if (quality > 60) {
            quality -= 8; // Reducción media
          } else {
            quality -= 5; // Reducción más conservadora para calidades bajas
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

        // Si aún es muy grande, usar compresión más agresiva pero manteniendo calidad mínima
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
   * Optimización avanzada con múltiples estrategias
   * @param inputBuffer Buffer de la imagen original
   * @param options Opciones de optimización
   * @returns Buffer optimizado con mejor calidad
   */
  static async optimizeImageAdvanced(
    inputBuffer: Buffer,
    options: Partial<ImageOptimizationOptions> = {}
  ): Promise<Buffer> {
    const config = { ...this.DEFAULT_OPTIONS, ...options };

    try {
      // Obtener metadata de la imagen original
      const metadata = await sharp(inputBuffer).metadata();
      const originalSize = inputBuffer.length;

      // Estrategia 1: Optimización inicial con alta calidad
      let optimizedBuffer = await sharp(inputBuffer)
        .resize(config.width, config.height, {
          fit: 'cover',
          position: 'center',
          kernel: sharp.kernel.lanczos3, // Mejor algoritmo de redimensionado
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

      // Si el tamaño es aceptable, retornar
      if (sizeKB <= config.maxSizeKB) {
        return optimizedBuffer;
      }

      // Estrategia 2: Reducción gradual de calidad
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

      // Estrategia 3: Si aún es muy grande, usar compresión más agresiva
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
            quantisationTable: 3, // Tabla de cuantización optimizada
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
   * Guarda una imagen optimizada en el sistema de archivos
   * @param buffer Buffer de la imagen optimizada
   * @param filename Nombre del archivo
   * @param uploadPath Directorio de subida
   * @returns Ruta del archivo guardado
   */
  static async saveOptimizedImage(buffer: Buffer, filename: string, uploadPath: string): Promise<string> {
    try {
      // Crear directorio si no existe
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
   * Elimina una imagen del sistema de archivos
   * @param filePath Ruta del archivo a eliminar
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
   * Genera un nombre único para el archivo
   * @param originalName Nombre original del archivo
   * @returns Nombre único con timestamp
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '_');

    return `${sanitizedName}_${timestamp}${extension}`;
  }

  /**
   * Valida el tipo de archivo de imagen
   * @param mimetype Tipo MIME del archivo
   * @returns true si es un tipo de imagen válido
   */
  static isValidImageType(mimetype: string): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    return validTypes.includes(mimetype);
  }

  /**
   * Obtiene información de la imagen
   * @param buffer Buffer de la imagen
   * @returns Información de la imagen
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
