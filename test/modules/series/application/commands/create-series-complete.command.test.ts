import {
  CreateSeriesCompleteCommand,
  CreateSeriesCompleteRequest,
} from '../../../../../src/modules/series/application/commands/create-series-complete.command';

describe('CreateSeriesCompleteCommand', () => {
  it('should create a command with all required properties', () => {
    // Arrange
    const seriesData: CreateSeriesCompleteRequest = {
      name: 'Complete Test Series',
      chapter_number: 1,
      year: 2023,
      description: 'Complete test description',
      description_en: 'Complete test description in English',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
      genres: [1, 2, 3],
      titles: ['Title 1', 'Title 2'],
    };

    // Act
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert
    expect(command.seriesData).toBe(seriesData);
    expect(command.seriesData.name).toBe('Complete Test Series');
    expect(command.seriesData.chapter_number).toBe(1);
    expect(command.seriesData.year).toBe(2023);
    expect(command.seriesData.description).toBe('Complete test description');
    expect(command.seriesData.description_en).toBe('Complete test description in English');
    expect(command.seriesData.qualification).toBe(8.5);
    expect(command.seriesData.demography_id).toBe(1);
    expect(command.seriesData.visible).toBe(true);
    expect(command.seriesData.genres).toEqual([1, 2, 3]);
    expect(command.seriesData.titles).toEqual(['Title 1', 'Title 2']);
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should create a command without optional properties', () => {
    // Arrange
    const seriesData: CreateSeriesCompleteRequest = {
      name: 'Complete Test Series',
      chapter_number: 1,
      year: 2023,
      description: 'Complete test description',
      description_en: 'Complete test description in English',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
    };

    // Act
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert
    expect(command.seriesData).toBe(seriesData);
    expect(command.seriesData.name).toBe('Complete Test Series');
    expect(command.seriesData.genres).toBeUndefined();
    expect(command.seriesData.titles).toBeUndefined();
    expect(command.timestamp).toBeInstanceOf(Date);
  });

  it('should set timestamp on creation', () => {
    // Arrange
    const beforeCreation = new Date();
    const seriesData: CreateSeriesCompleteRequest = {
      name: 'Complete Test Series',
      chapter_number: 1,
      year: 2023,
      description: 'Complete test description',
      description_en: 'Complete test description in English',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
    };

    // Act
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert
    const afterCreation = new Date();
    expect(command.timestamp).toBeInstanceOf(Date);
    expect(command.timestamp.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(command.timestamp.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should handle empty arrays', () => {
    // Arrange
    const seriesData: CreateSeriesCompleteRequest = {
      name: 'Complete Test Series',
      chapter_number: 1,
      year: 2023,
      description: 'Complete test description',
      description_en: 'Complete test description in English',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
      genres: [],
      titles: [],
    };

    // Act
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert
    expect(command.seriesData.genres).toEqual([]);
    expect(command.seriesData.titles).toEqual([]);
    expect(command.seriesData.genres?.length).toBe(0);
    expect(command.seriesData.titles?.length).toBe(0);
  });

  it('should handle edge case values', () => {
    // Arrange
    const seriesData: CreateSeriesCompleteRequest = {
      name: '',
      chapter_number: 0,
      year: 1900,
      description: '',
      description_en: '',
      qualification: 0,
      demography_id: 0,
      visible: false,
      genres: [0, -1, Number.MAX_SAFE_INTEGER],
      titles: ['', 'A'.repeat(10000)],
    };

    // Act
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert
    expect(command.seriesData.name).toBe('');
    expect(command.seriesData.chapter_number).toBe(0);
    expect(command.seriesData.year).toBe(1900);
    expect(command.seriesData.description).toBe('');
    expect(command.seriesData.description_en).toBe('');
    expect(command.seriesData.qualification).toBe(0);
    expect(command.seriesData.demography_id).toBe(0);
    expect(command.seriesData.visible).toBe(false);
    expect(command.seriesData.genres).toEqual([0, -1, Number.MAX_SAFE_INTEGER]);
    expect(command.seriesData.titles).toEqual(['', 'A'.repeat(10000)]);
  });

  it('should preserve object reference', () => {
    // Arrange
    const seriesData: CreateSeriesCompleteRequest = {
      name: 'Complete Test Series',
      chapter_number: 1,
      year: 2023,
      description: 'Complete test description',
      description_en: 'Complete test description in English',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
      genres: [1, 2, 3],
      titles: ['Title 1', 'Title 2', 'Title 3'],
    };

    // Act
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert
    expect(command.seriesData).toBe(seriesData); // Same reference
    expect(command.seriesData).toEqual(seriesData); // Same content
  });

  it('should have readonly properties (TypeScript compile-time check)', () => {
    // Arrange
    const seriesData: CreateSeriesCompleteRequest = {
      name: 'Complete Test Series',
      chapter_number: 1,
      year: 2023,
      description: 'Complete test description',
      description_en: 'Complete test description in English',
      qualification: 8.5,
      demography_id: 1,
      visible: true,
      genres: [1, 2, 3],
      titles: ['Title 1', 'Title 2'],
    };
    const command = new CreateSeriesCompleteCommand(seriesData);

    // Assert - readonly properties should be accessible but not modifiable at compile time
    expect(command.seriesData).toBe(seriesData);
    expect(command.timestamp).toBeInstanceOf(Date);

    // Note: readonly properties are enforced at TypeScript compile time,
    // not at JavaScript runtime, so we can't test runtime immutability
  });

  it('should create unique timestamps for different instances', async () => {
    // Arrange
    const seriesData1: CreateSeriesCompleteRequest = {
      name: 'Series 1',
      chapter_number: 1,
      year: 2023,
      description: 'Desc 1',
      description_en: 'Desc 1 EN',
      qualification: 8.0,
      demography_id: 1,
      visible: true,
      genres: [1, 2],
      titles: ['Title A'],
    };

    const seriesData2: CreateSeriesCompleteRequest = {
      name: 'Series 2',
      chapter_number: 2,
      year: 2024,
      description: 'Desc 2',
      description_en: 'Desc 2 EN',
      qualification: 9.0,
      demography_id: 2,
      visible: false,
      genres: [3, 4],
      titles: ['Title B'],
    };

    // Act
    const command1 = new CreateSeriesCompleteCommand(seriesData1);
    await new Promise((resolve) => setTimeout(resolve, 1)); // Small delay to ensure different timestamps
    const command2 = new CreateSeriesCompleteCommand(seriesData2);

    // Assert
    expect(command1.timestamp).not.toBe(command2.timestamp);
    expect(command1.timestamp.getTime()).not.toBe(command2.timestamp.getTime());
  });
});
