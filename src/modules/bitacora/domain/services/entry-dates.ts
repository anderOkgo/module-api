import { MonthDay } from '../entities/entry.entity';

/**
 * Pure calendar-date rules for Bitácora (SPEC §3.2, D4, D5). No time zones:
 * every date is handled as a UTC calendar date, so the server's zone never
 * matters. The server only bounds dates; it never decides which day is "today"
 * for the user (D4, D9).
 */

export const MIN_DATE = '1900-01-01';
/** Days a deleted entry stays recoverable (D19). */
export const TRASH_DAYS = 30;
/** Window of the "nearby" lookup, in days on each side (C3). */
export const NEARBY_DAYS = 3;

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;
const DAY_MS = 24 * 60 * 60 * 1000;

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

const fromUtcDate = (d: Date): string =>
  `${pad(d.getUTCFullYear(), 4)}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

const toUtcDate = (date: string): Date => new Date(`${date}T00:00:00Z`);

/** True for `YYYY-MM-DD` strings that name a real calendar date (`2026-02-30` → false). */
export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  return parsed.getUTCFullYear() === y && parsed.getUTCMonth() === m - 1 && parsed.getUTCDate() === d;
}

/** The server's UTC calendar date. */
export function utcToday(now: Date): string {
  return fromUtcDate(now);
}

export function addDays(date: string, days: number): string {
  return fromUtcDate(new Date(toUtcDate(date).getTime() + days * DAY_MS));
}

/**
 * A date accepted by every `:date` endpoint: a real calendar date between
 * 1900-01-01 and one day after the server's UTC date (any time zone's "today"
 * fits; far-future typos are rejected).
 */
export function isEntryDate(value: unknown, now: Date): value is string {
  return isCalendarDate(value) && value >= MIN_DATE && value <= addDays(utcToday(now), 1);
}

export function yearOf(date: string): number {
  return Number(date.slice(0, 4));
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

const monthDayOf = (date: string): MonthDay => ({
  month: Number(date.slice(5, 7)),
  day: Number(date.slice(8, 10)),
});

/**
 * Month/day pairs that count as "the same day" in other years (D5): the date's
 * own month/day, plus Feb 29 when the date is Feb 28 of a non-leap year.
 */
export function onThisDayPairs(date: string): MonthDay[] {
  const own = monthDayOf(date);
  const pairs = [own];
  if (own.month === 2 && own.day === 28 && !isLeapYear(yearOf(date))) {
    pairs.push({ month: 2, day: 29 });
  }
  return pairs;
}

/**
 * The month/day pairs within ±NEARBY_DAYS of the date (crossing month and year
 * ends), excluding the date itself, each with its offset in days (C3).
 */
export function nearbyPairs(date: string): Array<MonthDay & { offsetDays: number }> {
  const pairs: Array<MonthDay & { offsetDays: number }> = [];
  for (let offset = -NEARBY_DAYS; offset <= NEARBY_DAYS; offset++) {
    if (offset !== 0) pairs.push({ ...monthDayOf(addDays(date, offset)), offsetDays: offset });
  }
  return pairs;
}

/** First and last calendar date of a `YYYY-MM` month at or after MIN_DATE, or null if invalid. */
export function monthRange(value: unknown): { from: string; to: string } | null {
  if (typeof value !== 'string') return null;
  const match = MONTH_PATTERN.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12 || year < yearOf(MIN_DATE)) return null;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return { from: `${value}-01`, to: `${value}-${pad(lastDay)}` };
}

/** `deletedAt` (UTC ISO, no milliseconds) + TRASH_DAYS, same format. */
export function purgeOn(deletedAt: string): string {
  return new Date(Date.parse(deletedAt) + TRASH_DAYS * DAY_MS).toISOString().replace('.000Z', 'Z');
}
