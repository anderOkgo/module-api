import { RemoveTitlesCommand } from '../../../../../src/modules/series/application/commands/remove-titles.command';

describe('RemoveTitlesCommand', () => {
  it('should create a command with seriesId and titleIds', () => {
    // Arrange
    const seriesId = 123;
    const titleIds = [1, 2, 3];

    // Act
    const command = new RemoveTitlesCommand(seriesId, titleIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titleIds).toBe(titleIds);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new RemoveTitlesCommand(123, [1, 2, 3]);

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle empty titleIds array', () => {
    // Arrange
    const seriesId = 123;
    const titleIds: number[] = [];

    // Act
    const command = new RemoveTitlesCommand(seriesId, titleIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titleIds).toBe(titleIds);
    expect(command.titleIds).toEqual([]);
    expect(command.titleIds.length).toBe(0);
  });

  it('should handle single titleId', () => {
    // Arrange
    const seriesId = 123;
    const titleIds = [1];

    // Act
    const command = new RemoveTitlesCommand(seriesId, titleIds);

    // Assert
    expect(command.seriesId).toBe(seriesId);
    expect(command.titleIds).toBe(titleIds);
    expect(command.titleIds).toEqual([1]);
    expect(command.titleIds.length).toBe(1);
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new RemoveTitlesCommand(123, [1, 2, 3]);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.seriesId).toBe(123);
    expect(command.titleIds).toEqual([1, 2, 3]);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });
});
