/**
 * Port for image processing
 * Defines the interface that any image processor must implement
 */
export interface ImageProcessorPort {
  processAndSaveImage(imageBuffer: Buffer, seriesId: number): Promise<string>;
  deleteImage(imagePath: string): Promise<void>;
}
