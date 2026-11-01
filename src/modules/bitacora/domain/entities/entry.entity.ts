/**
 * Bitácora domain types (module-docs/apps/bitacora/SPEC.md v1.0, §3.2).
 * Every date is a calendar date `YYYY-MM-DD` chosen by the client (D4); every
 * timestamp is a UTC ISO string without milliseconds (`2026-10-31T22:15:00Z`).
 */

/** One journal entry: exactly one per user per date (D6). */
export interface Entry {
  date: string;
  body: string;
  /** UTC ISO timestamp of the last write, for display. */
  modified: string;
  /** Optimistic-concurrency token: 1 on create, +1 on every write (C5). */
  version: number;
}

/** An entry from another year shown on the home screen (C2). */
export interface OnThisDayEntry extends Entry {
  yearsAgo: number;
}

/** An entry from another year within ±3 days of the requested date (C3). */
export interface NearbyEntry extends OnThisDayEntry {
  offsetDays: number;
}

export interface HomeData {
  date: string;
  entry: Entry | null;
  previousDay: { date: string; written: boolean };
  onThisDay: OnThisDayEntry[];
}

/** A row of the trash as stored (before `purgeOn` is derived). */
export interface TrashRow {
  date: string;
  preview: string;
  deletedAt: string;
}

export interface TrashItem extends TrashRow {
  purgeOn: string;
}

export interface DeletedEntry {
  date: string;
  purgeOn: string;
}

export interface MonthData {
  month: string;
  dates: string[];
}

export interface ImportItem {
  date: string;
  body: string;
}

export interface ImportResult {
  created: string[];
  overwritten: string[];
  skipped: string[];
}

export type RestoreConflictPolicy = 'fail' | 'replace' | 'keepBoth';
export type ImportConflictPolicy = 'skip' | 'overwrite';

/** A month/day pair, used for "on this day" and "nearby" lookups (D5). */
export interface MonthDay {
  month: number;
  day: number;
}
