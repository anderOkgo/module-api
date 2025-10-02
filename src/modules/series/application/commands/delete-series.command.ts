import { Command } from '../common/command.interface';

export class DeleteSeriesCommand implements Command<{ success: boolean; message: string }> {
  readonly timestamp: Date;

  constructor(public readonly id: number) {
    this.timestamp = new Date();
  }
}
