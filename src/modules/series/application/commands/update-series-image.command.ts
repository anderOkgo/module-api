import { Command } from '../common/command.interface';

export class UpdateSeriesImageCommand implements Command<{ success: boolean; message: string }> {
  readonly timestamp: Date = new Date();

  constructor(public readonly seriesId: number, public readonly imageFile?: Express.Multer.File) {}
}
