import { createHash } from 'crypto';
import cyfer, { cy, cyAsync, dcy, dcyAsync } from '../../../src/infrastructure/services/cyfer';

// cyfer version 2 (change 20261120-cyfer-v2; module-docs/apps/bitacora/SPEC.md §2.13, D40). The
// vectors are the library's shared ones, made with the browser's SHA-256; recover.py checks the same.
const KEY = 'an invented key';
const VECTOR_SHORT = 'AQIDR8ub/+vi4uzfQIVT7dNu4M5+IG8P+kSP';
const VECTOR_LONG =
  'AQID5mYifltL8T3fltx1oFn+M9VpnZkGvF3jlN7yfyqULLiuDSthy7GSCz435t+zHmjJr7MeyTlw1I1yjiv+W2H/NFDfQg';
const NONCE = () => Buffer.of(1, 2, 3);

/** A version-2 text made by hand from the plain body P (before it is reversed), for odd cases. */
function forge(plain: number[], key = KEY): string {
  const nonce = Buffer.of(9, 9, 9);
  const stream = createHash('sha256')
    .update(Buffer.concat([Buffer.from(key), nonce, Buffer.alloc(4)]))
    .digest();
  const body = Buffer.from(plain).reverse();
  return Buffer.concat([nonce, body.map((b, i) => (b + stream[i]) & 255)])
    .toString('base64')
    .replace(/=+$/, '');
}
const check = (bytes: number[]) => [...createHash('sha256').update(Buffer.from(bytes)).digest().subarray(0, 4)];

describe('cyfer version 2', () => {
  it('opens the shared vectors and writes them again with the same nonce', async () => {
    expect(dcy(VECTOR_SHORT, 'clave-ñ')).toBe('Mañana 🌙\nlínea');
    expect(cy('Mañana 🌙\nlínea', 'clave-ñ', NONCE())).toBe(VECTOR_SHORT);
    const long = 'Una noche tranquila en casa, leyendo y escribiendo. '.repeat(20);
    expect(await dcyAsync(VECTOR_LONG, 'clave-ñ')).toBe(long);
    expect(dcy(VECTOR_LONG, 'clave-ñ')).toBeNull();
    expect(await dcyAsync(VECTOR_SHORT, 'clave-ñ')).toBe('Mañana 🌙\nlínea');
    expect(await dcyAsync(await cyAsync(long, KEY), KEY)).toBe(long);
  });

  it('round-trips with a new text each time; empty text and key work', async () => {
    const text = 'señor 👨‍👩‍👧 "x"\n';
    const a = cy(text, KEY);
    expect(a).not.toBe(cy(text, KEY));
    expect(dcy(a, KEY)).toBe(text);
    expect(dcy(cy('', ''), '')).toBe('');
    expect(dcy(await cyAsync('hola', KEY), KEY)).toBe('hola'); // too short to compress
    expect(cyfer().dcy(cyfer().cy('x', KEY), KEY)).toBe('x');
  });

  it('a wrong key, a changed character or a text that is not cyfer gives null', async () => {
    const a = cy('the secret', KEY);
    expect(dcy(a, 'another key')).toBeNull();
    expect(dcy(a.slice(0, 8) + (a[8] === 'A' ? 'B' : 'A') + a.slice(9), KEY)).toBeNull();
    expect(dcy('not base64!', KEY)).toBeNull();
    expect(dcy('AAAA', KEY)).toBeNull();
    expect(await dcyAsync('not base64!', KEY)).toBeNull();
  });

  it('odd bodies never open: a flag above 1, bad UTF-8, a broken deflate', async () => {
    const x = [...Buffer.from('x')];
    expect(dcy(forge([0, ...check(x), ...x]), KEY)).toBe('x');
    expect(await dcyAsync(forge([2, ...check(x), ...x]), KEY)).toBeNull();
    const bad = [0xff, 0xfe];
    expect(dcy(forge([0, ...check(bad), ...bad]), KEY)).toBeNull();
    expect(await dcyAsync(forge([1, ...check(x), 0xff, 0xff, 0xff]), KEY)).toBeNull();
  });
});
