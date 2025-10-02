import { Command } from '../common/command.interface';

export class AssignGenresCommand implements Command<{ success: boolean; message: string }> {
  readonly timestamp: Date;

  constructor(public readonly seriesId: number, public readonly genreIds: number[]) {
    this.timestamp = new Date();
  }
}
