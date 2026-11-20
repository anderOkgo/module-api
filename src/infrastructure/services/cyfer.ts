/**
 * cyfer, version 2 — the owner's cipher, ported to TypeScript for Node (change 20261120-cyfer-v2).
 * The JavaScript library is the reference (home: github.com/anderOkgo/cyfer-vanilla, dist/js/cyfer.js;
 * spec: module-docs/apps/bitacora/SPEC.md §2.13, D40). Same format and the same vectors; here SHA-256,
 * the random nonce and deflate-raw come from Node's crypto and zlib, so every call is synchronous and
 * the async pair only wraps it.
 *
 *   B  = UTF-8 of the text;  K = the first 4 bytes of SHA-256(B)
 *   P  = 0x00 ‖ K ‖ B, or 0x01 ‖ K ‖ deflate-raw(B) when shorter (cyAsync only)
 *   C  = reverse(P), each byte + one byte of the key stream, mod 256
 *   key stream = SHA-256(UTF-8 key ‖ nonce ‖ block, 4 bytes big-endian), block after block
 *   out = base64 without "=" of (nonce, 3 random bytes ‖ C)
 *
 * Not used by any route today (the old helper was not either); kept in step with the library.
 */
import { createHash, randomBytes } from 'crypto';
import { deflateRawSync, inflateRawSync } from 'zlib';

const NONCE_BYTES = 3;
const CHECK_BYTES = 4;

const sha256 = (data: Buffer): Buffer => createHash('sha256').update(data).digest();
const checkOf = (bytes: Buffer): Buffer => sha256(bytes).subarray(0, CHECK_BYTES);

function keyStream(key: string, nonce: Buffer, length: number): Buffer {
  const keyBytes = Buffer.from(key, 'utf8');
  const blocks: Buffer[] = [];
  for (let block = 0; block * 32 < length; block++) {
    const counter = Buffer.alloc(4);
    counter.writeUInt32BE(block);
    blocks.push(sha256(Buffer.concat([keyBytes, nonce, counter])));
  }
  return Buffer.concat(blocks).subarray(0, length);
}

function seal(body: Buffer, key: string, nonce: Buffer): string {
  const reversed = Buffer.from(body).reverse();
  const stream = keyStream(key, nonce, reversed.length);
  const cipher = reversed.map((b, i) => (b + stream[i]) & 255);
  return Buffer.concat([nonce, cipher]).toString('base64').replace(/=+$/, '');
}

function unseal(text: string, key: string): Buffer | null {
  if (!/^[A-Za-z0-9+/]*$/.test(text)) return null;
  const bytes = Buffer.from(text, 'base64');
  if (bytes.length < NONCE_BYTES + 1 + CHECK_BYTES) return null;
  const nonce = bytes.subarray(0, NONCE_BYTES);
  const cipher = bytes.subarray(NONCE_BYTES);
  const stream = keyStream(key, nonce, cipher.length);
  return Buffer.from(cipher.map((b, i) => (b - stream[i]) & 255)).reverse();
}

function finish(raw: Buffer, check: Buffer): string | null {
  if (!checkOf(raw).equals(check)) return null;
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(raw);
  } catch {
    return null;
  }
}

/** Ciphers `text` with `key` (never compressed). `nonce` is for tests only. */
export function cy(text: string, key: string, nonce: Buffer = randomBytes(NONCE_BYTES)): string {
  const raw = Buffer.from(text, 'utf8');
  return seal(Buffer.concat([Buffer.of(0), checkOf(raw), raw]), key, nonce);
}

/** The text of an uncompressed cyfer text, or null (wrong key, changed, compressed or not cyfer). */
export function dcy(text: string, key: string): string | null {
  const body = unseal(text, key);
  if (body === null || body[0] !== 0) return null;
  return finish(body.subarray(1 + CHECK_BYTES), body.subarray(1, 1 + CHECK_BYTES));
}

/** Ciphers `text`, compressed with deflate-raw when that is shorter. */
export async function cyAsync(text: string, key: string, nonce: Buffer = randomBytes(NONCE_BYTES)): Promise<string> {
  const raw = Buffer.from(text, 'utf8');
  const packed = deflateRawSync(raw);
  if (packed.length < raw.length) return seal(Buffer.concat([Buffer.of(1), checkOf(raw), packed]), key, nonce);
  return cy(text, key, nonce);
}

/** The text of any cyfer version-2 text, compressed or not, or null. */
export async function dcyAsync(text: string, key: string): Promise<string | null> {
  const body = unseal(text, key);
  if (body === null || body[0] > 1) return null;
  if (body[0] === 0) return dcy(text, key);
  try {
    return finish(inflateRawSync(body.subarray(1 + CHECK_BYTES)), body.subarray(1, 1 + CHECK_BYTES));
  } catch {
    return null;
  }
}

/** `cyfer().cy(...)`, as in the apps. */
const cyfer = () => ({ cy, dcy, cyAsync, dcyAsync });

export default cyfer;
