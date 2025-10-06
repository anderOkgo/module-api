import { RemoveGenresCommand } from '../../../../../src/modules/series/application/commands/remove-genres.command';

describe('RemoveGenresCommand', () => {
  it('should create a command with seriesId and genreIds', () => {
    // Arrange
    const seriesId = 123;
    const genreIds = [1, 2, 3];

    // Act
    const command = new RemoveGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toBe(genreIds);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new RemoveGenresCommand(123, [1, 2, 3]);

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
    const command = new RemoveGenresCommand(seriesId, genreIds);

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
    const command = new RemoveGenresCommand(seriesId, genreIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.genreIds).toBe(genreIds);
    expect(command.genreIds).toEqual([1]);
    expect(command.genreIds.length).toBe(1);
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new RemoveGenresCommand(123, [1, 2, 3]);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.seriesId).toBe(123);
    expect(command.genreIds).toEqual([1, 2, 3]);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });
});
