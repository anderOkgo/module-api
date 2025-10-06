import { UpdateSeriesImageCommand } from '../../../../../src/modules/series/application/commands/update-series-image.command';

describe('UpdateSeriesImageCommand', () => {
  it('should create a command with seriesId and imageFile', () => {
    // Arrange
    const seriesId = 123;
    const imageFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Act
    const command = new UpdateSeriesImageCommand(seriesId, imageFile);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.imageFile).toBe(imageFile);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should create a command without optional imageFile', () => {
    // Arrange
    const seriesId = 123;

    // Act
    const command = new UpdateSeriesImageCommand(seriesId);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.imageFile).toBeUndefined();
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();
    const seriesId = 123;
    const imageFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Act
    const command = new UpdateSeriesImageCommand(seriesId, imageFile);

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle edge case values for seriesId', () => {
    // Test with zero seriesId
    const imageFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };
    const commandZero = new UpdateSeriesImageCommand(0, imageFile);
    expect(commandZero.seriesId).toBe(0);

    // Test with negative seriesId
    const commandNegative = new UpdateSeriesImageCommand(-1, imageFile);
    expect(commandNegative.seriesId).toBe(-1);

    // Test with maximum safe integer seriesId
    const commandMax = new UpdateSeriesImageCommand(Number.MAX_SAFE_INTEGER, imageFile);
    expect(commandMax.seriesId).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle different image file types', () => {
    // Arrange
    const seriesId = 123;
    const imageFiles: Express.Multer.File[] = [
      {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('jpeg-data'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
      {
        fieldname: 'image',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 2048,
        buffer: Buffer.from('png-data'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
      {
        fieldname: 'image',
        originalname: 'test.webp',
        encoding: '7bit',
        mimetype: 'image/webp',
        size: 512,
        buffer: Buffer.from('webp-data'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      },
    ];

    imageFiles.forEach((imageFile, index) => {
      // Act
      const command = new UpdateSeriesImageCommand(seriesId, imageFile);

      // Assert
      expect(command.seriesId).toBe(seriesId);
      expect(command.imageFile).toBe(imageFile);
      expect(command.imageFile?.mimetype).toBe(imageFile.mimetype);
      expect(command.imageFile?.originalname).toBe(imageFile.originalname);
    });
  });

  it('should preserve file reference', () => {
    // Arrange
    const seriesId = 123;
    const imageFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Act
    const command = new UpdateSeriesImageCommand(seriesId, imageFile);

    // Assert
    expect(command.imageFile).toBe(imageFile); // Same reference
    expect(command.imageFile).toEqual(imageFile); // Same content
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const seriesId = 123;
    const imageFile: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'test.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('test-image-data'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };
    const command = new UpdateSeriesImageCommand(seriesId, imageFile);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.seriesId).toBe(seriesId);
    expect(command.imageFile).toBe(imageFile);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique timestamps for different instances', async () => {
    // Arrange
    const imageFile1: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'image1.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 1024,
      buffer: Buffer.from('image1'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    const imageFile2: Express.Multer.File = {
      fieldname: 'image',
      originalname: 'image2.jpg',
      encoding: '7bit',
      mimetype: 'image/jpeg',
      size: 2048,
      buffer: Buffer.from('image2'),
      destination: '',
      filename: '',
      path: '',
      stream: null as any,
    };

    // Act
    const command1 = new UpdateSeriesImageCommand(1, imageFile1);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Longer delay to ensure different timestamps
    const command2 = new UpdateSeriesImageCommand(2, imageFile2);

    // Assert
    expect(command1.timestamp).not.toBe(command2.timestamp);
    expect(command1.timestamp.getTime()).not.toBe(command2.timestamp.getTime());
  });
});
