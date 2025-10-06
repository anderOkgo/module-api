import { UpdateSeriesCommand } from '../../../../../src/modules/series/application/commands/update-series.command';

describe('UpdateSeriesCommand', () => {
  it('should create a command with required id and optional properties', () => {
    // Arrange
    const id = 123;
    const name = 'Updated Series';
    const chapter_number = 2;
    const year = 2024;
    const description = 'Updated description';
    const description_en = 'Updated description in English';
    const qualification = 9.0;
    const demography_id = 2;
    const visible = false;

    // Act
    const command = new UpdateSeriesCommand(
      id,
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
    expect(command.id).toBe(id);
    expect(command.name).toBe(name);
    expect(command.chapter_number).toBe(chapter_number);
    expect(command.year).toBe(year);
    expect(command.description).toBe(description);
    expect(command.description_en).toBe(description_en);
    expect(command.qualification).toBe(qualification);
    expect(command.demography_id).toBe(demography_id);
    expect(command.visible).toBe(visible);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should create a command with only required id', () => {
    // Arrange
    const id = 123;

    // Act
    const command = new UpdateSeriesCommand(id);

    // Assert
    expect(command.id).toBe(id);
    expect(command.name).toBeUndefined();
    expect(command.chapter_number).toBeUndefined();
    expect(command.year).toBeUndefined();
    expect(command.description).toBeUndefined();
    expect(command.description_en).toBeUndefined();
    expect(command.qualification).toBeUndefined();
    expect(command.demography_id).toBeUndefined();
    expect(command.visible).toBeUndefined();
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should create a command with partial updates', () => {
    // Arrange
    const id = 123;
    const name = 'Partially Updated Series';
    const year = 2024;

    // Act
    const command = new UpdateSeriesCommand(id, name, undefined, year);

    // Assert
    expect(command.id).toBe(id);
    expect(command.name).toBe(name);
    expect(command.chapter_number).toBeUndefined();
    expect(command.year).toBe(year);
    expect(command.description).toBeUndefined();
    expect(command.description_en).toBeUndefined();
    expect(command.qualification).toBeUndefined();
    expect(command.demography_id).toBeUndefined();
    expect(command.visible).toBeUndefined();
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new UpdateSeriesCommand(123, 'Updated Series');

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle edge case values', () => {
    // Arrange
    const id = 0;
    const name = '';
    const chapter_number = 0;
    const year = 1900;
    const description = '';
    const description_en = '';
    const qualification = 0;
    const demography_id = 0;
    const visible = false;

    // Act
    const command = new UpdateSeriesCommand(
      id,
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
    expect(command.id).toBe(0);
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
    const id = Number.MAX_SAFE_INTEGER;
    const name = 'A'.repeat(1000);
    const chapter_number = Number.MAX_SAFE_INTEGER;
    const year = 3000;
    const description = 'B'.repeat(10000);
    const description_en = 'C'.repeat(10000);
    const qualification = 10;
    const demography_id = Number.MAX_SAFE_INTEGER;
    const visible = true;

    // Act
    const command = new UpdateSeriesCommand(
      id,
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
    expect(command.id).toBe(Number.MAX_SAFE_INTEGER);
    expect(command.name).toBe(name);
    expect(command.chapter_number).toBe(Number.MAX_SAFE_INTEGER);
    expect(command.year).toBe(3000);
    expect(command.description).toBe(description);
    expect(command.description_en).toBe(description_en);
    expect(command.qualification).toBe(10);
    expect(command.demography_id).toBe(Number.MAX_SAFE_INTEGER);
    expect(command.visible).toBe(true);
  });

  it('should handle null and undefined values', () => {
    // Arrange
    const id = 123;

    // Act
    const command = new UpdateSeriesCommand(
      id,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined
    );

    // Assert
    expect(command.id).toBe(id);
    expect(command.name).toBeUndefined();
    expect(command.chapter_number).toBeUndefined();
    expect(command.year).toBeUndefined();
    expect(command.description).toBeUndefined();
    expect(command.description_en).toBeUndefined();
    expect(command.qualification).toBeUndefined();
    expect(command.demography_id).toBeUndefined();
    expect(command.visible).toBeUndefined();
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new UpdateSeriesCommand(123, 'Updated Series');

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.id).toBe(123);
    expect(command.name).toBe('Updated Series');
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });
});
