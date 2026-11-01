import { BitacoraRepository } from '../ports/bitacora.repository';
import { NearbyEntry } from '../../domain/entities/entry.entity';
import { addDays, isEntryDate, nearbyPairs, yearOf } from '../../domain/services/entry-dates';
import { badRequest, Clock, INVALID_DATE, isUserId, succeed, systemClock, unauthorized, UseCaseResult } from './use-case-result';

/**
 * C3 `GET /entries/:date/nearby`: other years' entries within ±3 days of the
 * date, excluding exact matches (those are in C2). An entry belongs to the year
 * of its anchor (the entry date minus its offset), so for Jan 2 the Dec 30 just
 * before it is "this year", not another one. Ordered by year (newest first),
 * then offset.
 */
export class GetNearbyUseCase {
  constructor(private readonly repository: BitacoraRepository, private readonly clock: Clock = systemClock) {}

  async execute(userId: unknown, date: unknown): Promise<UseCaseResult<NearbyEntry[]>> {
    if (!isUserId(userId)) return unauthorized();
    if (!isEntryDate(date, this.clock())) return badRequest([INVALID_DATE]);

    const pairs = nearbyPairs(date);
    const offsetByMonthDay = new Map(pairs.map((p) => [`${p.month}-${p.day}`, p.offsetDays]));
    const year = yearOf(date);
    const rows = await this.repository.findByMonthDays(userId, pairs);

    const nearby: NearbyEntry[] = [];
    for (const row of rows) {
      const monthDay = `${Number(row.date.slice(5, 7))}-${Number(row.date.slice(8, 10))}`;
      const offsetDays = offsetByMonthDay.get(monthDay) as number;
      const anchorYear = yearOf(addDays(row.date, -offsetDays));
      if (anchorYear !== year) nearby.push({ ...row, yearsAgo: year - anchorYear, offsetDays });
    }
    nearby.sort((a, b) => a.yearsAgo - b.yearsAgo || a.offsetDays - b.offsetDays);

    return succeed(nearby, 'Nearby entries loaded');
  }
}
