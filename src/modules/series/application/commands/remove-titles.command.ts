import { Command } from '../common/command.interface';

export class RemoveTitlesCommand implements Command<{ success: boolean; message: string }> {
  readonly timestamp: Date;

  constructor(public readonly seriesId: number, public readonly titleIds: number[]) {
    this.timestamp = new Date();
  }
}
