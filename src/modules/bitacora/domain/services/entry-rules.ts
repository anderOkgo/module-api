import { ImportConflictPolicy, ImportItem, RestoreConflictPolicy } from '../entities/entry.entity';
import { isEntryDate } from './entry-dates';

/**
 * Input rules for Bitácora requests (SPEC §3.2). Pure functions: each returns
 * either the normalized value or a list of error messages. Error messages
 * never echo the entry text (N2).
 */

export const MAX_BODY_CHARS = 100_000;
export const MAX_IMPORT_ITEMS = 1_000;
/** Length of the trash preview, in characters (C12). */
export const PREVIEW_CHARS = 140;
/** Separator used by "Keep both": the other version, a blank line, then this one (§2.3). */
export const KEEP_BOTH_SEPARATOR = '\n\n';

export type Checked<T> = { ok: true; value: T } | { ok: false; errors: string[] };

const valid = <T>(value: T): Checked<T> => ({ ok: true, value });
const invalid = <T>(...errors: string[]): Checked<T> => ({ ok: false, errors });

/** Characters as the user sees them (code points), so an emoji counts once, as in MariaDB. */
export const charCount = (text: string): number => [...text].length;

/** `body`: a string of 1–100,000 characters after trimming; returns the trimmed text. */
export function checkBody(raw: unknown, field = 'body'): Checked<string> {
  if (typeof raw !== 'string') return invalid(`${field} must be a string`);
  const body = raw.trim();
  if (body.length === 0) return invalid(`${field} must not be empty`);
  if (charCount(body) > MAX_BODY_CHARS) return invalid(`${field} must be at most ${MAX_BODY_CHARS} characters`);
  return valid(body);
}

/** `baseVersion`: the version the client last saw (a positive integer), or null when it saw no entry. */
export function checkBaseVersion(raw: unknown): Checked<number | null> {
  if (raw === null) return valid(null);
  if (Number.isInteger(raw) && (raw as number) >= 1) return valid(raw as number);
  return invalid('baseVersion must be a positive integer or null');
}

const RESTORE_POLICIES: RestoreConflictPolicy[] = ['fail', 'replace', 'keepBoth'];
const IMPORT_POLICIES: ImportConflictPolicy[] = ['skip', 'overwrite'];

/** `onConflict` of a restore; defaults to "fail" when absent. */
export function checkRestorePolicy(raw: unknown): Checked<RestoreConflictPolicy> {
  if (raw === undefined) return valid('fail');
  if (RESTORE_POLICIES.includes(raw as RestoreConflictPolicy)) return valid(raw as RestoreConflictPolicy);
  return invalid(`onConflict must be one of: ${RESTORE_POLICIES.join(', ')}`);
}

/**
 * The bulk import payload (C11): 1–1,000 items, every item valid and every date
 * unique; any error rejects the whole request (all or nothing).
 */
export function checkImport(
  raw: unknown,
  now: Date
): Checked<{ items: ImportItem[]; onConflict: ImportConflictPolicy }> {
  const payload = (raw ?? {}) as { entries?: unknown; onConflict?: unknown };
  const errors: string[] = [];

  if (!IMPORT_POLICIES.includes(payload.onConflict as ImportConflictPolicy)) {
    errors.push(`onConflict must be one of: ${IMPORT_POLICIES.join(', ')}`);
  }

  const entries = payload.entries;
  if (!Array.isArray(entries) || entries.length === 0 || entries.length > MAX_IMPORT_ITEMS) {
    errors.push(`entries must be an array of 1 to ${MAX_IMPORT_ITEMS} items`);
    return invalid(...errors);
  }

  const items: ImportItem[] = [];
  const seen = new Set<string>();
  entries.forEach((entry: unknown, index: number) => {
    const { date, body } = (entry ?? {}) as { date?: unknown; body?: unknown };
    if (!isEntryDate(date, now)) {
      errors.push(`entries[${index}].date is not a valid date`);
    } else if (seen.has(date)) {
      errors.push(`entries[${index}].date is repeated`);
    } else {
      seen.add(date);
    }
    const checkedBody = checkBody(body, `entries[${index}].body`);
    if (!checkedBody.ok) errors.push(...checkedBody.errors);
    else items.push({ date: date as string, body: checkedBody.value }); // only used when there are no errors
  });

  if (errors.length > 0) return invalid(...errors);
  return valid({ items, onConflict: payload.onConflict as ImportConflictPolicy });
}
