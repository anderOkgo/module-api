import {
  Entry,
  ImportConflictPolicy,
  ImportItem,
  ImportResult,
  MonthDay,
  RestoreConflictPolicy,
  SearchPage,
  TrashRow,
} from '../../domain/entities/entry.entity';
import { BodyCipher } from './body-cipher';

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
 *
 * Bodies are stored encrypted (SPEC v1.11 §4.6, D32): every method that reads
 * or writes a body takes the request's `cipher`, and accepts and returns plain
 * text only.
 */
export interface BitacoraRepository {
  findEntry(userId: number, date: string, cipher: BodyCipher): Promise<Entry | null>;
  hasEntry(userId: number, date: string): Promise<boolean>;
  /** Entries of any year whose month/day is one of `pairs`, newest first. */
  findByMonthDays(userId: number, pairs: MonthDay[], cipher: BodyCipher): Promise<Entry[]>;
  /** Dates with an entry between `from` and `to` (inclusive), ascending. */
  listDates(userId: number, from: string, to: string): Promise<string[]>;
  /**
   * Creates or replaces the entry of `date` unless it changed since the client
   * saw `baseVersion` (C5); on conflict nothing is written.
   */
  saveEntry(
    userId: number,
    date: string,
    body: string,
    baseVersion: number | null,
    cipher: BodyCipher
  ): Promise<SaveOutcome>;
  /** Moves the entry to the trash; returns its UTC deletion time, or null if there was none (C6). */
  moveToTrash(userId: number, date: string): Promise<{ deletedAt: string } | null>;
  /** Purges expired rows, then lists the trash of the last 30 days, newest deletion first (C12). */
  listTrash(userId: number, cipher: BodyCipher): Promise<TrashRow[]>;
  /** Restores the newest trash row of `date` within 30 days (C13). */
  restoreFromTrash(
    userId: number,
    date: string,
    onConflict: RestoreConflictPolicy,
    cipher: BodyCipher
  ): Promise<RestoreOutcome>;
  /**
   * Days whose body holds every term (case- and accent-blind, terms literal),
   * newest first: the total and one page of rows (C14). The database holds
   * ciphertext only, so the bodies are decrypted and matched in the API (v1.11).
   */
  searchEntries(
    userId: number,
    terms: string[],
    limit: number,
    offset: number,
    cipher: BodyCipher
  ): Promise<SearchPage>;
  /** All-or-nothing bulk load (C11). */
  importEntries(
    userId: number,
    items: ImportItem[],
    onConflict: ImportConflictPolicy,
    cipher: BodyCipher
  ): Promise<ImportResult>;
}
