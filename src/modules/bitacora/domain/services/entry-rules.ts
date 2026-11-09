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

/* ------------------------------------------------------------------ Search (C14, SPEC v1.10) */

export const SEARCH_MAX_QUERY_CHARS = 200;
export const SEARCH_MIN_TERM_CHARS = 2;
export const SEARCH_MAX_TERMS = 10;
export const SEARCH_PAGE_SIZE = 50;
export const SNIPPET_CHARS = 200;
/** Characters of context kept before the first match in a snippet. */
const SNIPPET_LEAD = 60;
const ELLIPSIS = '…';

/**
 * Splits a query into terms: each `"…"` pair is one phrase, the rest is split
 * on whitespace; an unmatched `"` stays a plain character. Terms shorter than
 * 2 characters are dropped.
 */
export function searchTerms(query: string): string[] {
  const terms: string[] = [];
  const pattern = /"([^"]+)"|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(query)) !== null) {
    const term = (match[1] ?? match[2]).trim();
    if (charCount(term) >= SEARCH_MIN_TERM_CHARS) terms.push(term);
  }
  return terms;
}

/** `{ q, offset? }` of C14. Error messages never echo the query (N2). */
export function checkSearch(raw: unknown): Checked<{ terms: string[]; offset: number }> {
  const { q, offset = 0 } = (raw ?? {}) as { q?: unknown; offset?: unknown };
  const errors: string[] = [];
  let terms: string[] = [];

  if (typeof q !== 'string') {
    errors.push('q must be a string');
  } else {
    const query = q.trim();
    if (charCount(query) < SEARCH_MIN_TERM_CHARS || charCount(query) > SEARCH_MAX_QUERY_CHARS) {
      errors.push(`q must be ${SEARCH_MIN_TERM_CHARS} to ${SEARCH_MAX_QUERY_CHARS} characters`);
    } else {
      terms = searchTerms(query);
      if (terms.length === 0) errors.push(`q must hold a word or phrase of at least ${SEARCH_MIN_TERM_CHARS} characters`);
      if (terms.length > SEARCH_MAX_TERMS) errors.push(`q must hold at most ${SEARCH_MAX_TERMS} words or phrases`);
    }
  }
  if (!Number.isInteger(offset) || (offset as number) < 0) errors.push('offset must be an integer of 0 or more');

  if (errors.length > 0) return invalid(...errors);
  return valid({ terms, offset: offset as number });
}

/** A `LIKE` pattern matching `term` anywhere, with `\`, `%` and `_` taken literally (escape `\`). */
export const likePattern = (term: string): string => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

/**
 * Folds text as the collation does for search (lower case, accents removed),
 * keeping for each folded code point the index of its source code point.
 */
function fold(chars: string[]): { text: string[]; source: number[] } {
  const text: string[] = [];
  const source: number[] = [];
  chars.forEach((char, index) => {
    for (const folded of char.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()) {
      text.push(folded);
      source.push(index);
    }
  });
  return { text, source };
}

/**
 * Up to 200 characters of `body` around the first match of `term`, with line
 * breaks and runs of spaces as one space and `…` where it was cut (C14). If
 * the folding finds no match, the snippet starts at the beginning.
 */
export function searchSnippet(body: string, term: string): string {
  const chars = [...body.replace(/\s+/g, ' ').trim()];
  const haystack = fold(chars);
  const needle = fold([...term]).text.join('');
  const at = haystack.text.join('').indexOf(needle);
  // indexOf works on UTF-16 units; folded code points outside the BMP are rare, so map back through them.
  const foldedIndex = at === -1 ? -1 : [...haystack.text.join('').slice(0, at)].length;
  const position = foldedIndex === -1 ? 0 : haystack.source[foldedIndex];

  let start = Math.max(0, position - SNIPPET_LEAD);
  start = Math.max(0, Math.min(start, chars.length - SNIPPET_CHARS));
  const end = Math.min(chars.length, start + SNIPPET_CHARS);
  return `${start > 0 ? ELLIPSIS : ''}${chars.slice(start, end).join('')}${end < chars.length ? ELLIPSIS : ''}`;
}
