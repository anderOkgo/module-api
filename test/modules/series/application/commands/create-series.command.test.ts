import { CreateSeriesCommand } from '../../../../../src/modules/series/application/commands/create-series.command';

describe('CreateSeriesCommand', () => {
  it('should create a command with all required properties', () => {
    // Arrange
    const name = 'Test Series';
    const chapter_number = 1;
    const year = 2023;
    const description = 'Test description';
    const description_en = 'Test description in English';
    const qualification = 8.5;
    const demography_id = 1;
    const visible = true;
    const imageBuffer = Buffer.from('test-image-data');

    // Act
    const command = new CreateSeriesCommand(
      name,
      chapter_number,
      year,
      description,
      description_en,
      qualification,
      demography_id,
      visible,
      imageBuffer
    );

    // Assert
    expect(command.name).toBe(name);
    expect(command.chapter_number).toBe(chapter_number);
    expect(command.year).toBe(year);
    expect(command.description).toBe(description);
    expect(command.description_en).toBe(description_en);
    expect(command.qualification).toBe(qualification);
    expect(command.demography_id).toBe(demography_id);
    expect(command.visible).toBe(visible);
    expect(command.imageBuffer).toBe(imageBuffer);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should create a command without optional imageBuffer', () => {
    // Arrange
    const name = 'Test Series';
    const chapter_number = 1;
    const year = 2023;
    const description = 'Test description';
    const description_en = 'Test description in English';
    const qualification = 8.5;
    const demography_id = 1;
    const visible = true;

    // Act
    const command = new CreateSeriesCommand(
      name,
      chapter_number,
      year,
      description,
      description_en,
      qualification,
      demography_id,
      visible
    );

    // Assert
    expect(command.name).toBe(name);
    expect(command.chapter_number).toBe(chapter_number);
    expect(command.year).toBe(year);
    expect(command.description).toBe(description);
    expect(command.description_en).toBe(description_en);
    expect(command.qualification).toBe(qualification);
    expect(command.demography_id).toBe(demography_id);
    expect(command.visible).toBe(visible);
    expect(command.imageBuffer).toBeUndefined();
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new CreateSeriesCommand(
      'Test Series',
      1,
      2023,
      'Test description',
      'Test description in English',
      8.5,
      1,
      true
    );

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle edge case values', () => {
    // Arrange
    const name = '';
    const chapter_number = 0;
    const year = 1900;
    const description = '';
    const description_en = '';
    const qualification = 0;
    const demography_id = 0;
    const visible = false;

    // Act
    const command = new CreateSeriesCommand(
      name,
      chapter_number,
      year,
      description,
      description_en,
      qualification,
      demography_id,
      visible
    );

    // Assert
    expect(command.name).toBe('');
    expect(command.chapter_number).toBe(0);
    expect(command.year).toBe(1900);
    expect(command.description).toBe('');
    expect(command.description_en).toBe('');
    expect(command.qualification).toBe(0);
    expect(command.demography_id).toBe(0);
    expect(command.visible).toBe(false);
  });

  it('should handle maximum values', () => {
    // Arrange
    const name = 'A'.repeat(1000);
    const chapter_number = Number.MAX_SAFE_INTEGER;
    const year = 3000;
    const description = 'B'.repeat(10000);
    const description_en = 'C'.repeat(10000);
    const qualification = 10;
    const demography_id = Number.MAX_SAFE_INTEGER;
    const visible = true;

    // Act
    const command = new CreateSeriesCommand(
      name,
      chapter_number,
      year,
      description,
      description_en,
      qualification,
      demography_id,
      visible
    );

    // Assert
    expect(command.name).toBe(name);
    expect(command.chapter_number).toBe(Number.MAX_SAFE_INTEGER);
    expect(command.year).toBe(3000);
    expect(command.description).toBe(description);
    expect(command.description_en).toBe(description_en);
    expect(command.qualification).toBe(10);
    expect(command.demography_id).toBe(Number.MAX_SAFE_INTEGER);
    expect(command.visible).toBe(true);
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new CreateSeriesCommand(
      'Test Series',
      1,
      2023,
      'Test description',
      'Test description in English',
      8.5,
      1,
      true
    );

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.name).toBe('Test Series');
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });
});
