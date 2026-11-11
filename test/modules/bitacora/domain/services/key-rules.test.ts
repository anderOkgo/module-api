import { randomBytes } from 'crypto';
import {
  checkKeyParams,
  fromBase64url,
  MAX_ITERATIONS,
  MIN_ITERATIONS,
  parseKeyHeader,
  toBase64url,
} from '../../../../../src/modules/bitacora/domain/services/key-rules';

const SALT = toBase64url(randomBytes(16));

describe('key rules (SPEC v1.11 §3.5)', () => {
  describe('base64url', () => {
    it('round-trips without padding', () => {
      const bytes = Buffer.from([0xfb, 0xff, 0xbf, 0x00]);
      expect(toBase64url(bytes)).toBe('-_-_AA');
      expect(fromBase64url('-_-_AA')?.equals(bytes)).toBe(true);
    });

    it.each([['with padding', 'AA=='], ['standard base64', '+/+/'], ['empty', ''], ['bad length', 'AAAAA'], ['non-canonical', 'AB'], ['a number', 7]])(
      'rejects %s',
      (_name, raw) => {
        expect(fromBase64url(raw)).toBeNull();
      }
    );
  });

  describe('parseKeyHeader', () => {
    it('accepts 32 bytes', () => {
      const key = randomBytes(32);
      expect(parseKeyHeader(toBase64url(key))?.equals(key)).toBe(true);
    });

    it.each([[undefined], [toBase64url(randomBytes(31))], [['a', 'b']], ['not a key!']])('rejects %p', (raw) => {
      expect(parseKeyHeader(raw)).toBeNull();
    });
  });

  describe('checkKeyParams', () => {
    it('accepts the limits', () => {
      expect(checkKeyParams({ iterations: MIN_ITERATIONS, salt: SALT })).toEqual({
        ok: true,
        value: { iterations: MIN_ITERATIONS, salt: SALT },
      });
      expect(checkKeyParams({ iterations: MAX_ITERATIONS, salt: SALT }).ok).toBe(true);
    });

    it('collects both errors, without echoing the values (N2)', () => {
      const result = checkKeyParams({ iterations: 1000, salt: 'secret-looking' });
      expect(result).toEqual({
        ok: false,
        errors: [
          'iterations must be an integer from 600000 to 10000000',
          'salt must be 16 bytes in unpadded base64url',
        ],
      });
      expect(JSON.stringify(result)).not.toContain('secret-looking');
    });

    it.each([[undefined], [{ iterations: MAX_ITERATIONS + 1, salt: SALT }], [{ iterations: 600000.5, salt: SALT }], [{ iterations: MIN_ITERATIONS, salt: toBase64url(randomBytes(15)) }]])(
      'rejects %p',
      (raw) => {
        expect(checkKeyParams(raw).ok).toBe(false);
      }
    );
  });
});
