import { UpdateSeriesImageHandler } from '../../../../../../src/modules/series/application/handlers/commands/update-series-image.handler';
import { UpdateSeriesImageCommand } from '../../../../../../src/modules/series/application/commands/update-series-image.command';
import { SeriesWriteRepository } from '../../../../../../src/modules/series/application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../../../../src/modules/series/application/ports/series-read.repository';
import { ImageService } from '../../../../../../src/modules/series/application/services/image.service';

const mockWrite: jest.Mocked<SeriesWriteRepository> = {
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  updateImage: jest.fn(),
  assignGenres: jest.fn(),
  removeGenres: jest.fn(),
  addTitles: jest.fn(),
  removeTitles: jest.fn(),
  updateRank: jest.fn(),
};

const mockRead: jest.Mocked<SeriesReadRepository> = {
  findById: jest.fn(),
  findByNameAndYear: jest.fn(),
  findAll: jest.fn(),
  search: jest.fn(),
  getProductions: jest.fn(),
  getGenres: jest.fn(),
  getDemographics: jest.fn(),
  getProductionYears: jest.fn(),
};

const mockImageService = {
  processAndSaveImage: jest.fn(),
  deleteImage: jest.fn(),
} as unknown as jest.Mocked<ImageService>;

const fakeFile = { buffer: Buffer.from('fake-image-data') } as Express.Multer.File;

describe('UpdateSeriesImageHandler', () => {
  let handler: UpdateSeriesImageHandler;

  beforeEach(() => {
    handler = new UpdateSeriesImageHandler(mockWrite, mockRead, mockImageService);
    jest.clearAllMocks();
    mockImageService.processAndSaveImage.mockResolvedValue('/img/tarjeta/1_123.jpg');
    mockWrite.updateImage.mockResolvedValue(true);
  });

  it('processes and saves the new image, with no old image to delete', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, image: undefined } as any);

    const result = await handler.execute(new UpdateSeriesImageCommand(1, fakeFile));

    expect(mockImageService.processAndSaveImage).toHaveBeenCalledWith(fakeFile.buffer, 1);
    expect(mockWrite.updateImage).toHaveBeenCalledWith(1, '/img/tarjeta/1_123.jpg');
    expect(mockImageService.deleteImage).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true, message: 'Series image updated successfully' });
  });

  it('deletes the previous image after the new one is saved', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, image: '/img/tarjeta/1_old.jpg' } as any);
    mockImageService.deleteImage.mockResolvedValue(undefined);

    await handler.execute(new UpdateSeriesImageCommand(1, fakeFile));

    expect(mockImageService.deleteImage).toHaveBeenCalledWith('/img/tarjeta/1_old.jpg');
  });

  it('treats a blank existing image path as "no old image"', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, image: '   ' } as any);

    await handler.execute(new UpdateSeriesImageCommand(1, fakeFile));

    expect(mockImageService.deleteImage).not.toHaveBeenCalled();
  });

  it('succeeds even when deleting the old image fails', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, image: '/img/tarjeta/1_old.jpg' } as any);
    mockImageService.deleteImage.mockRejectedValue(new Error('disk error'));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = await handler.execute(new UpdateSeriesImageCommand(1, fakeFile));

    expect(result.success).toBe(true);
    expect(warnSpy).toHaveBeenCalledWith(
      'Could not delete old image for series 1:',
      expect.any(Error)
    );
    warnSpy.mockRestore();
  });

  it('wraps an invalid series id error', async () => {
    await expect(handler.execute(new UpdateSeriesImageCommand(0, fakeFile))).rejects.toThrow(
      'Error updating series image: Valid series ID is required'
    );
  });

  it('wraps a missing-image-file error', async () => {
    await expect(handler.execute(new UpdateSeriesImageCommand(1, undefined))).rejects.toThrow(
      'Error updating series image: Image file is required'
    );
  });

  it('wraps an empty-buffer image file error', async () => {
    const emptyFile = { buffer: Buffer.alloc(0) } as Express.Multer.File;
    await expect(handler.execute(new UpdateSeriesImageCommand(1, emptyFile))).rejects.toThrow(
      'Error updating series image: Image file is required'
    );
  });

  it('wraps an image-too-large error', async () => {
    const hugeFile = { buffer: Buffer.alloc(10 * 1024 * 1024 + 1) } as Express.Multer.File;
    await expect(handler.execute(new UpdateSeriesImageCommand(1, hugeFile))).rejects.toThrow(
      /Image size must not exceed 10 MB/
    );
  });

  it('wraps a non-Error rejection with a generic message', async () => {
    mockRead.findById.mockResolvedValue({ id: 1, image: undefined } as any);
    mockImageService.processAndSaveImage.mockRejectedValue('raw string failure');

    await expect(handler.execute(new UpdateSeriesImageCommand(1, fakeFile))).rejects.toThrow(
      'Error updating series image: Unknown error'
    );
  });

  it('wraps a series-not-found error', async () => {
    mockRead.findById.mockResolvedValue(null);

    await expect(handler.execute(new UpdateSeriesImageCommand(999, fakeFile))).rejects.toThrow(
      'Error updating series image: Series not found'
    );
    expect(mockWrite.updateImage).not.toHaveBeenCalled();
  });
});
