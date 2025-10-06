import { CommandHandler } from '../../common/command.interface';
import { AddTitlesCommand } from '../../commands/add-titles.command';
import { SeriesWriteRepository } from '../../../application/ports/series-write.repository';
import { SeriesReadRepository } from '../../../application/ports/series-read.repository';

export class AddTitlesHandler implements CommandHandler<AddTitlesCommand, { success: boolean; message: string }> {
  constructor(
    private readonly writeRepository: SeriesWriteRepository,
    private readonly readRepository: SeriesReadRepository
  ) {}

  async execute(command: AddTitlesCommand): Promise<{ success: boolean; message: string }> {
    // 1. Validate input
    this.validateInput(command);

    // 2. Verify that the series exists
    const series = await this.readRepository.findById(command.seriesId);
    if (!series) {
      throw new Error('Series not found');
    }

    // 3. Normalize titles (remove empty and duplicates)
    const normalizedTitles = this.normalizeTitles(command.titles);

    if (normalizedTitles.length === 0) {
      throw new Error('No valid titles provided');
    }

    // 4. Add titles
    await this.writeRepository.addTitles(command.seriesId, normalizedTitles);

    return {
      success: true,
      message: `Titles added successfully to series ${command.seriesId}`,
    };
  }

  private validateInput(command: AddTitlesCommand): void {
    if (!command.seriesId || command.seriesId <= 0) {
      throw new Error('Valid series ID is required');
    }

    if (!Array.isArray(command.titles) || command.titles.length === 0) {
      throw new Error('At least one title is required');
    }
  }

  private normalizeTitles(titles: string[]): string[] {
    return titles
      .map((title) => title.trim())
      .filter((title) => title.length > 0)
      .filter((title, index, array) => array.indexOf(title) === index); // Remove duplicates
  }
}
