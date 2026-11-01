import {
  Entry,
  ImportConflictPolicy,
  ImportItem,
  ImportResult,
  MonthDay,
  RestoreConflictPolicy,
  TrashRow,
} from '../../domain/entities/entry.entity';

export type SaveOutcome =
  | { kind: 'created'; entry: Entry }
  | { kind: 'replaced'; entry: Entry }
  | { kind: 'conflict'; entry: Entry };

export type RestoreOutcome =
  | { kind: 'restored'; entry: Entry }
  | { kind: 'conflict'; entry: Entry }
  | { kind: 'notFound' };

/**
 * Persistence port for Bitácora (SPEC §4). Every method is scoped to one
 * `userId` (D1, D8): an implementation must filter every read and write by it.
 * Multi-statement operations (save, delete, restore, import) are atomic.
 */
export interface BitacoraRepository {
  findEntry(userId: number, date: string): Promise<Entry | null>;
  hasEntry(userId: number, date: string): Promise<boolean>;
  /** Entries of any year whose month/day is one of `pairs`, newest first. */
  findByMonthDays(userId: number, pairs: MonthDay[]): Promise<Entry[]>;
  /** Dates with an entry between `from` and `to` (inclusive), ascending. */
  listDates(userId: number, from: string, to: string): Promise<string[]>;
  /**
   * Creates or replaces the entry of `date` unless it changed since the client
   * saw `baseVersion` (C5); on conflict nothing is written.
   */
  saveEntry(userId: number, date: string, body: string, baseVersion: number | null): Promise<SaveOutcome>;
  /** Moves the entry to the trash; returns its UTC deletion time, or null if there was none (C6). */
  moveToTrash(userId: number, date: string): Promise<{ deletedAt: string } | null>;
  /** Purges expired rows, then lists the trash of the last 30 days, newest deletion first (C12). */
  listTrash(userId: number): Promise<TrashRow[]>;
  /** Restores the newest trash row of `date` within 30 days (C13). */
  restoreFromTrash(userId: number, date: string, onConflict: RestoreConflictPolicy): Promise<RestoreOutcome>;
  /** All-or-nothing bulk load (C11). */
  importEntries(userId: number, items: ImportItem[], onConflict: ImportConflictPolicy): Promise<ImportResult>;
}
