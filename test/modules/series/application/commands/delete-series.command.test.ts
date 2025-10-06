import { DeleteSeriesCommand } from '../../../../../src/modules/series/application/commands/delete-series.command';

describe('DeleteSeriesCommand', () => {
  it('should create a command with required id property', () => {
    // Arrange
    const id = 123;

    // Act
    const command = new DeleteSeriesCommand(id);

    // Assert
    expect(command.id).toBe(id);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();

    // Act
    const command = new DeleteSeriesCommand(123);

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle edge case values', () => {
    // Test with zero ID
    const commandZero = new DeleteSeriesCommand(0);
    expect(commandZero.id).toBe(0);

    // Test with negative ID
    const commandNegative = new DeleteSeriesCommand(-1);
    expect(commandNegative.id).toBe(-1);

    // Test with maximum safe integer
    const commandMax = new DeleteSeriesCommand(Number.MAX_SAFE_INTEGER);
    expect(commandMax.id).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('should handle different numeric types', () => {
    // Test with different numeric values
    const testCases = [
      { id: 1, expected: 1 },
      { id: 999, expected: 999 },
      { id: 0.5, expected: 0.5 },
      { id: -999, expected: -999 },
    ];

    testCases.forEach(({ id, expected }) => {
      const command = new DeleteSeriesCommand(id);
      expect(command.id).toBe(expected);
    });
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const command = new DeleteSeriesCommand(123);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.id).toBe(123);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique timestamps for different instances', async () => {
    // Arrange
    const command1 = new DeleteSeriesCommand(1);
    await new Promise((resolve) => setTimeout(resolve, 10)); // Longer delay to ensure different timestamps
    const command2 = new DeleteSeriesCommand(2);

    // Act & Assert
    expect(command1.timestamp).not.toBe(command2.timestamp);
    expect(command1.timestamp.getTime()).not.toBe(command2.timestamp.getTime());
  });

  it('should maintain timestamp consistency within same instance', () => {
    // Arrange
    const command = new DeleteSeriesCommand(123);
    const timestamp1 = command.timestamp;
    const timestamp2 = command.timestamp;

    // Act & Assert
    expect(timestamp1).toBe(timestamp2);
    expect(timestamp1.getTime()).toBe(timestamp2.getTime());
  });
});
