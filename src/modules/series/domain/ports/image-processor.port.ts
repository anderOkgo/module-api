/**
 * Puerto para procesamiento de imágenes
 * Define la interfaz que debe implementar cualquier procesador de imágenes
 */
export interface ImageProcessorPort {
  processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string>;
  deleteImage(imagePath: string): Promise<void>;
}
