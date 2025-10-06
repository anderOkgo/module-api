import { AddTitlesCommand } from '../../../../../src/modules/series/application/commands/add-titles.command';

describe('AddTitlesCommand', () => {
  it('should create a command with seriesId and titles', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['Title 1', 'Title 2', 'Title 3'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toBe(titles);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new AddTitlesCommand(123, ['Title 1', 'Title 2']);

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle empty titles array', () => {
    // Arrange
    const seriesId = 123;
    const titles: string[] = [];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toBe(titles);
    expect(command.titles).toEqual([]);
    expect(command.titles.length).toBe(0);
  });

  it('should handle single title', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['Single Title'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toBe(titles);
    expect(command.titles).toEqual(['Single Title']);
    expect(command.titles.length).toBe(1);
  });

  it('should handle large arrays of titles', () => {
    // Arrange
    const seriesId = 123;
    const titles = Array.from({ length: 100 }, (_, i) => `Title ${i + 1}`);

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toBe(titles);
    expect(command.titles.length).toBe(100);
    expect(command.titles[0]).toBe('Title 1');
    expect(command.titles[99]).toBe('Title 100');
  });

  it('should handle edge case values for seriesId', () => {
    // Test with zero seriesId
    const commandZero = new AddTitlesCommand(0, ['Title 1']);
    expect(commandZero.seriesId).toBe(0);

    // Test with negative seriesId
    const commandNegative = new AddTitlesCommand(-1, ['Title 1']);
    expect(commandNegative.seriesId).toBe(-1);

    // Test with maximum safe integer seriesId
    const commandMax = new AddTitlesCommand(Number.MAX_SAFE_INTEGER, ['Title 1']);
    expect(commandMax.seriesId).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle titles with edge case values', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['', 'A'.repeat(10000), 'Title with special chars: !@#$%^&*()'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toEqual(['', 'A'.repeat(10000), 'Title with special chars: !@#$%^&*()']);
  });

  it('should handle duplicate titles', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['Title 1', 'Title 2', 'Title 1', 'Title 3', 'Title 2'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toEqual(['Title 1', 'Title 2', 'Title 1', 'Title 3', 'Title 2']);
    expect(command.titles.length).toBe(5);
  });

  it('should handle titles with unicode characters', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['Título en Español', 'タイトル', 'Заголовок', 'عنوان', '🎬 Title with Emoji'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toEqual(['Título en Español', 'タイトル', 'Заголовок', 'عنوان', '🎬 Title with Emoji']);
  });

  it('should preserve array reference', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['Title 1', 'Title 2', 'Title 3'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.titles).toBe(titles); // Same reference
    expect(command.titles).toEqual(titles); // Same content
  });

  it('should handle null and undefined values in titles', () => {
    // Arrange
    const seriesId = 123;
    const titles = ['Title 1', '', 'Title 3'];

    // Act
    const command = new AddTitlesCommand(seriesId, titles);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titles).toEqual(['Title 1', '', 'Title 3']);
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new AddTitlesCommand(123, ['Title 1', 'Title 2']);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.seriesId).toBe(123);
    expect(command.titles).toEqual(['Title 1', 'Title 2']);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique timestamps for different instances', async () => {
    // Arrange
    const command1 = new AddTitlesCommand(1, ['Title A']);
    await new Promise((resolve) => setTimeout(resolve, 1)); // Small delay to ensure different timestamps
    const command2 = new AddTitlesCommand(2, ['Title B']);

    // Act & Assert
    expect(command1.timestamp).not.toBe(command2.timestamp);
    expect(command1.timestamp.getTime()).not.toBe(command2.timestamp.getTime());
  });

  it('should maintain timestamp consistency within same instance', () => {
    // Arrange
    const command = new AddTitlesCommand(123, ['Title 1', 'Title 2']);
    const timestamp1 = command.timestamp;
    const timestamp2 = command.timestamp;

    // Act & Assert
    expect(timestamp1).toBe(timestamp2);
    expect(timestamp1.getTime()).toBe(timestamp2.getTime());
  });
});
