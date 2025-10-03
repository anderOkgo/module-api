import { Command } from '../common/command.interface';
import { SeriesResponse } from '../../domain/entities/series.entity';

export class UpdateSeriesCommand implements Command<SeriesResponse> {
  readonly timestamp: Date;

  constructor(
    public readonly id: number,
    public readonly name?: string,
    public readonly chapter_number?: number,
    public readonly year?: number,
    public readonly description?: string,
    public readonly description_en?: string,
    public readonly qualification?: number,
    public readonly demography_id?: number,
    public readonly visible?: boolean
  ) {
    this.timestamp = new Date();
  }
}
