import { AssignGenresCommand } from '../../../../../src/modules/series/application/commands/assign-genres.command';

describe('AssignGenresCommand', () => {
  it('should create a command with seriesId and genreIds', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = [1, 2, 3];

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toBe(genreIds);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new AssignGenresCommand(123, [1, 2, 3]);

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle empty genreIds array', () => {
    // Arrange
    const seriesId = 123;
    const genreIds: number[] = [];

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toBe(genreIds);
    expect(command.genreIds).toEqual([]);
    expect(command.genreIds.length).toBe(0);
  });

  it('should handle single genreId', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = [1];

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toBe(genreIds);
    expect(command.genreIds).toEqual([1]);
    expect(command.genreIds.length).toBe(1);
  });

  it('should handle large arrays of genreIds', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = Array.from({ length: 100 }, (_, i) => i + 1);

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toBe(genreIds);
    expect(command.genreIds.length).toBe(100);
    expect(command.genreIds[0]).toBe(1);
    expect(command.genreIds[99]).toBe(100);
  });

  it('should handle edge case values', () => {
    // Test with zero seriesId
    const commandZero = new AssignGenresCommand(0, [1, 2, 3]);
    expect(commandZero.seriesId).toBe(0);

    // Test with negative seriesId
    const commandNegative = new AssignGenresCommand(-1, [1, 2, 3]);
    expect(commandNegative.seriesId).toBe(-1);

    // Test with maximum safe integer seriesId
    const commandMax = new AssignGenresCommand(Number.MAX_SAFE_INTEGER, [1, 2, 3]);
    expect(commandMax.seriesId).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle genreIds with edge case values', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = [0, -1, Number.MAX_SAFE_INTEGER];

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toEqual([0, -1, Number.MAX_SAFE_INTEGER]);
  });

  it('should handle duplicate genreIds', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = [1, 2, 2, 3, 3, 3];

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toEqual([1, 2, 2, 3, 3, 3]);
    expect(command.genreIds.length).toBe(6);
  });

  it('should preserve array reference', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = [1, 2, 3];

    // Act
    const command = new AssignGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.genreIds).toBe(genreIds); // Same reference
    expect(command.genreIds).toEqual(genreIds); // Same content
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new AssignGenresCommand(123, [1, 2, 3]);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.seriesId).toBe(123);
    expect(command.genreIds).toEqual([1, 2, 3]);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique timestamps for different instances', async () => {
    // Arrange
    const command1 = new AssignGenresCommand(1, [1, 2]);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Increased delay to ensure different timestamps
    const command2 = new AssignGenresCommand(2, [3, 4]);

    // Act & Assert
    expect(command1.timestamp).not.toBe(command2.timestamp);
    expect(command1.timestamp.getTime()).not.toBe(command2.timestamp.getTime());
  });

  it('should maintain timestamp consistency within same instance', () => {
    // Arrange
    const command = new AssignGenresCommand(123, [1, 2, 3]);
    const timestamp1 = command.timestamp;
    const timestamp2 = command.timestamp;

    // Act & Assert
    expect(timestamp1).toBe(timestamp2);
    expect(timestamp1.getTime()).toBe(timestamp2.getTime());
  });
});
