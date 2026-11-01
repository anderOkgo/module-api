import {
  addDays,
  isCalendarDate,
  isEntryDate,
  isLeapYear,
  monthRange,
  nearbyPairs,
  onThisDayPairs,
  purgeOn,
  utcToday,
  yearOf,
} from '../../../../../src/modules/bitacora/domain/services/entry-dates';

// Server clock fixed at 2026-10-31 23:30 UTC.
const NOW = new Date('2026-10-31T23:30:00Z');

describe('entry-dates', () => {
  describe('isCalendarDate', () => {
    it.each(['2026-03-04', '2024-02-29', '1900-01-01', '2026-12-31'])('accepts %s', (date) => {
      expect(isCalendarDate(date)).toBe(true);
    });

    it.each(['2026-02-30', '2026-13-01', '2025-02-29', 'abc', '2026-3-4', '2026-03-04T00:00', '', 20260304, null])(
      'rejects %p',
      (value) => {
        expect(isCalendarDate(value)).toBe(false);
      }
    );
  });

  describe('isEntryDate (A8)', () => {
    it('accepts the bounds: 1900-01-01 and one day after the server UTC date', () => {
      expect(isEntryDate('1900-01-01', NOW)).toBe(true);
      expect(isEntryDate('2026-11-01', NOW)).toBe(true);
    });

    it.each(['1899-12-31', '2026-11-02', '2026-02-30', 'abc'])('rejects %s', (date) => {
      expect(isEntryDate(date, NOW)).toBe(false);
    });
  });

  it('utcToday uses the UTC date, not the local one', () => {
    expect(utcToday(new Date('2026-11-01T02:00:00Z'))).toBe('2026-11-01');
  });

  it('addDays crosses month, year and leap-day boundaries', () => {
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
    expect(addDays('2026-10-31', 30)).toBe('2026-11-30');
  });

  it('yearOf and isLeapYear', () => {
    expect(yearOf('2019-03-04')).toBe(2019);
    expect([2024, 2000, 2026, 1900].map(isLeapYear)).toEqual([true, true, false, false]);
  });

  describe('onThisDayPairs (D5)', () => {
    it('is the own month/day for an ordinary date', () => {
      expect(onThisDayPairs('2026-03-04')).toEqual([{ month: 3, day: 4 }]);
    });

    it('adds Feb 29 on Feb 28 of a non-leap year (H3)', () => {
      expect(onThisDayPairs('2026-02-28')).toEqual([
        { month: 2, day: 28 },
        { month: 2, day: 29 },
      ]);
    });

    it('does not add Feb 29 on Feb 28 of a leap year, nor on other February days', () => {
      expect(onThisDayPairs('2024-02-28')).toEqual([{ month: 2, day: 28 }]);
      expect(onThisDayPairs('2026-02-27')).toEqual([{ month: 2, day: 27 }]);
    });
  });

  it('nearbyPairs gives ±3 days across the year end, without the date itself (H4)', () => {
    expect(nearbyPairs('2026-01-02')).toEqual([
      { month: 12, day: 30, offsetDays: -3 },
      { month: 12, day: 31, offsetDays: -2 },
      { month: 1, day: 1, offsetDays: -1 },
      { month: 1, day: 3, offsetDays: 1 },
      { month: 1, day: 4, offsetDays: 2 },
      { month: 1, day: 5, offsetDays: 3 },
    ]);
  });

  describe('monthRange (M1, M2)', () => {
    it('returns the first and last day of the month', () => {
      expect(monthRange('2026-02')).toEqual({ from: '2026-02-01', to: '2026-02-28' });
      expect(monthRange('2024-02')).toEqual({ from: '2024-02-01', to: '2024-02-29' });
      expect(monthRange('2026-10')).toEqual({ from: '2026-10-01', to: '2026-10-31' });
    });

    it.each(['2026-13', '2026-00', 'abc', '2026-1', '1899-12', undefined, ['2026-02']])('rejects %p', (value) => {
      expect(monthRange(value)).toBeNull();
    });
  });

  it('purgeOn is 30 days after the deletion, same format', () => {
    expect(purgeOn('2026-10-31T22:15:00Z')).toBe('2026-11-30T22:15:00Z');
  });
});
