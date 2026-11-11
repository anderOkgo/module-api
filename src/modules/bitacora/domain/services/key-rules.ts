import { Checked } from './entry-rules';

/**
 * Input rules for the diary key (SPEC v1.11 §3.5, §4.6). Pure functions. Error messages never echo
 * a key, a salt or any header value (N2).
 */

/** The only key derivation the device uses: PBKDF2 with HMAC-SHA-256. */
export const KDF = 'PBKDF2-SHA256';
export const MIN_ITERATIONS = 600_000;
export const MAX_ITERATIONS = 10_000_000;
export const SALT_BYTES = 16;
export const KEY_BYTES = 32;

/** Request headers that carry the key derived from the passphrase (never the passphrase itself). */
export const KEY_HEADER = 'x-bitacora-key';
export const NEW_KEY_HEADER = 'x-bitacora-new-key';

const BASE64URL = /^[A-Za-z0-9_-]+$/;

/** Bytes of an unpadded base64url string, or null when it is not one. */
export function fromBase64url(raw: unknown): Buffer | null {
  if (typeof raw !== 'string' || !BASE64URL.test(raw) || raw.length % 4 === 1) return null;
  const bytes = Buffer.from(raw.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  // Reject non-canonical encodings (stray bits in the last character) by encoding back.
  return toBase64url(bytes) === raw ? bytes : null;
}

/** Unpadded base64url of `bytes`. */
export const toBase64url = (bytes: Buffer): string =>
  bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/** The 32-byte key of a header, or null when the header is missing or malformed. */
export function parseKeyHeader(raw: unknown): Buffer | null {
  const bytes = fromBase64url(raw);
  return bytes && bytes.length === KEY_BYTES ? bytes : null;
}

/** `{ iterations, salt }` of C15 and C17. */
export function checkKeyParams(raw: unknown): Checked<{ iterations: number; salt: string }> {
  const { iterations, salt } = (raw ?? {}) as { iterations?: unknown; salt?: unknown };
  const errors: string[] = [];
  if (!Number.isInteger(iterations) || (iterations as number) < MIN_ITERATIONS || (iterations as number) > MAX_ITERATIONS) {
    errors.push(`iterations must be an integer from ${MIN_ITERATIONS} to ${MAX_ITERATIONS}`);
  }
  const saltBytes = fromBase64url(salt);
  if (!saltBytes || saltBytes.length !== SALT_BYTES) errors.push(`salt must be ${SALT_BYTES} bytes in unpadded base64url`);
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value: { iterations: iterations as number, salt: salt as string } };
}
