import { BitacoraRepository } from '../ports/bitacora.repository';
import { HomeData } from '../../domain/entities/entry.entity';
import { addDays, isEntryDate, onThisDayPairs, yearOf } from '../../domain/services/entry-dates';
import { badRequest, Clock, INVALID_DATE, isUserId, succeed, systemClock, unauthorized, UseCaseResult } from './use-case-result';

/** C2 `GET /home/:date`: the day's entry, whether the previous day is written, and "on this day" (D5). */
export class GetHomeUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, date: unknown): Promise<UseCaseResult<HomeData>> {
    if (!isUserId(userId)) return unauthorized();
    if (!isEntryDate(date, this.clock())) return badRequest([INVALID_DATE]);

    const previousDate = addDays(date, -1);
    const year = yearOf(date);
    const [entry, previousWritten, sameDay] = await Promise.all([
      this.repository.findEntry(userId, date),
      this.repository.hasEntry(userId, previousDate),
      this.repository.findByMonthDays(userId, onThisDayPairs(date)),
    ]);

    // Newest first comes from the repository; the requested year itself is not "another year".
    const onThisDay = sameDay
      .filter((other) => yearOf(other.date) !== year)
      .map((other) => ({ ...other, yearsAgo: year - yearOf(other.date) }));

    return succeed(
      { date, entry, previousDay: { date: previousDate, written: previousWritten }, onThisDay },
      'Home loaded'
    );
  }
}
