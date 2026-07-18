import { CommandHandler } from '../../common/command.interface';
import { UpdateSeriesImageCommand } from '../../commands/update-series-image.command';
import { SeriesWriteRepository } from '../../ports/series-write.repository';
import { SeriesReadRepository } from '../../ports/series-read.repository';
import { ImageService } from '../../services/image.service';

/**
 * Handler to update a series image
 * Orchestrates deletion of previous image and saving of new one
 * // Validated under FULLTEST
 */
export class UpdateSeriesImageHandler
  implements CommandHandler<UpdateSeriesImageCommand, { success: boolean; message: string }>
{
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository,
    private readonly imageService: ImageService
  ) {}

  async execute(command: UpdateSeriesImageCommand): Promise<{ success: boolean; message: string }> {
    try {
      const { seriesId, imageFile } = command;

      // 1. Validate input (throws 'Image file is required' if imageFile is missing/empty)
      this.validateInput(seriesId, imageFile);

      // 2. Verify that the series exists
      const existingSeries = await this.readRepository.findById(seriesId);
      if (!existingSeries) {
        throw new Error('Series not found');
      }

      const oldImagePath = existingSeries.image && existingSeries.image.trim() !== '' ? existingSeries.image : null;

      // 3. Process and save new image
      const imagePath = await this.imageService.processAndSaveImage(imageFile!.buffer, seriesId);

      // 4. Update path in DB
      await this.writeRepository.updateImage(seriesId, imagePath);

      // 5. Delete previous image only after new one is confirmed saved
      if (oldImagePath) {
        try {
          await this.imageService.deleteImage(oldImagePath);
        } catch (error) {
          console.warn(`Could not delete old image for series ${seriesId}:`, error);
        }
      }

      return {
        success: true,
        message: 'Series image updated successfully',
      };
    } catch (error) {
      throw new Error(`Error updating series image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateInput(id: number, imageFile?: Express.Multer.File): void {
    if (!id || id <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!imageFile || !imageFile.buffer || imageFile.buffer.length === 0) {
      throw new Error('Image file is required');
    }

    // Validate maximum size. Matches uploadMiddleware's multer limit (see
    // src/infrastructure/services/upload.ts) - that limit is enforced first,
    // before a request ever reaches this handler, so this check exists only
    // to fail with a clear message on non-HTTP/direct callers; it must stay
    // in sync with multer's fileSize or it becomes unreachable dead code.
    const MAX_SIZE = 5 * 1024 * 1024;
    if (imageFile.buffer.length > MAX_SIZE) {
      throw new Error(`Image size must not exceed ${MAX_SIZE / 1024 / 1024} MB`);
    }
  }
}
