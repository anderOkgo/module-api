import { Command } from '../common/command.interface';

export class AddTitlesCommand implements Command<{ success: boolean; message: string }> {
  readonly timestamp: Date;

  constructor(public readonly seriesId: number, public readonly titles: string[]) {
    this.timestamp = new Date();
  }
}
