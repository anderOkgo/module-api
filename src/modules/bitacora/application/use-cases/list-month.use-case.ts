import { BitacoraRepository } from '../ports/bitacora.repository';
import { MonthData } from '../../domain/entities/entry.entity';
import { monthRange } from '../../domain/services/entry-dates';
import { badRequest, isUserId, succeed, unauthorized, UseCaseResult } from './use-case-result';

/** C7 `GET /entries?month=YYYY-MM`: the dates of that month with an entry, ascending, no text. */
export class ListMonthUseCase {
  constructor(private readonly repository: BitacoraRepository) {}

  async execute(userId: unknown, month: unknown): Promise<UseCaseResult<MonthData>> {
    if (!isUserId(userId)) return unauthorized();
    const range = monthRange(month);
    if (!range) return badRequest(['month must be a real month (YYYY-MM) from 1900-01']);

    const dates = await this.repository.listDates(userId, range.from, range.to);
    return succeed({ month: month as string, dates }, 'Month loaded');
  }
}
