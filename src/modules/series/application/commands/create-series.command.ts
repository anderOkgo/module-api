import { Command } from '../common/command.interface';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class CreateSeriesCommand implements Command<SeriesResponse> {
  readonly timestamp: Date;

  constructor(
    public readonly name: string,
    public readonly chapter_number: number,
    public readonly year: number,
    public readonly description: string,
    public readonly qualification: number,
    public readonly demography_id: number,
    public readonly visible: boolean,
    public readonly imageBuffer?: Buffer
  ) {
    this.timestamp = new Date();
  }
}
