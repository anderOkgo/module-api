import { Command } from '../common/command.interface';

export interface CreateSeriesCompleteRequest {
  name: string;
  chapter_number: number;
  year: number;
  description: string;
  qualification: number;
  demography_id: number;
  visible: boolean;
  genres?: number[];
  titles?: string[];
}

export class CreateSeriesCompleteCommand implements Command<{ success: boolean; message: string; id?: number }> {
  readonly timestamp: Date = new Date();

  constructor(public readonly seriesData: CreateSeriesCompleteRequest) {}
}
