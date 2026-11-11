import { randomBytes } from 'crypto';
import {
  AesGcmBodyCipher,
  aesGcmDiaryKeyCrypto,
  open,
  seal,
  UndecryptableBodyError,
} from '../../../../../src/modules/bitacora/infrastructure/crypto/aes-gcm';

const USER = 7;
const DEK = randomBytes(32);

describe('AES-256-GCM for Bitácora (SPEC v1.11 §4.6)', () => {
  describe('seal / open', () => {
    it('round-trips and writes the v1 format: base64 of IV 12 + tag 16 + ciphertext', () => {
      const sealed = seal(DEK, Buffer.from('Hello'), 'aad');
      expect(sealed.startsWith('v1:')).toBe(true);
      expect(Buffer.from(sealed.slice(3), 'base64')).toHaveLength(12 + 16 + 5);
      expect(open(DEK, sealed, 'aad')?.toString()).toBe('Hello');
    });

    it('uses a new IV every time', () => {
      expect(seal(DEK, Buffer.from('Hello'), 'aad')).not.toBe(seal(DEK, Buffer.from('Hello'), 'aad'));
    });

    it.each([
      ['another key', () => open(randomBytes(32), seal(DEK, Buffer.from('x'), 'aad'), 'aad')],
      ['another AAD', () => open(DEK, seal(DEK, Buffer.from('x'), 'aad'), 'other')],
      ['no v1 prefix', () => open(DEK, 'plain text', 'aad')],
      ['too short', () => open(DEK, 'v1:AAAA', 'aad')],
      ['a non-string', () => open(DEK, undefined as unknown as string, 'aad')],
      [
        'a changed byte',
        () => {
          const raw = Buffer.from(seal(DEK, Buffer.from('Hello'), 'aad').slice(3), 'base64');
          raw[raw.length - 1] ^= 1;
          return open(DEK, `v1:${raw.toString('base64')}`, 'aad');
        },
      ],
    ])('returns null with %s', (_name, attempt) => {
      expect(attempt()).toBeNull();
    });
  });

  describe('AesGcmBodyCipher', () => {
    const cipher = new AesGcmBodyCipher(USER, DEK);

    it('round-trips UTF-8 text with accents and emoji, and never stores it readable (K3)', () => {
      const text = 'Fui a Bogotá 😀 con mi familia';
      const stored = cipher.encrypt('2026-03-04', text);
      expect(stored).not.toContain('Bogot');
      expect(cipher.decrypt('2026-03-04', stored)).toBe(text);
    });

    it('a body moved to another date or user does not decrypt, and the error carries no text (K5)', () => {
      const stored = cipher.encrypt('2026-03-04', 'Secret line');
      expect(() => cipher.decrypt('2026-03-05', stored)).toThrow(UndecryptableBodyError);
      expect(() => new AesGcmBodyCipher(USER + 1, DEK).decrypt('2026-03-04', stored)).toThrow(
        'An entry body cannot be decrypted'
      );
    });
  });

  describe('aesGcmDiaryKeyCrypto', () => {
    const kek = randomBytes(32);

    it('makes 32-byte data keys, different each time', () => {
      const a = aesGcmDiaryKeyCrypto.generateDek();
      expect(a).toHaveLength(32);
      expect(a.equals(aesGcmDiaryKeyCrypto.generateDek())).toBe(false);
    });

    it('wraps a data key that only the same key and user unwrap; the wrapped form fits VARCHAR(128)', () => {
      const wrapped = aesGcmDiaryKeyCrypto.wrapDek(USER, kek, DEK);
      expect(wrapped.length).toBeLessThanOrEqual(128);
      expect(aesGcmDiaryKeyCrypto.unwrapDek(USER, kek, wrapped)?.equals(DEK)).toBe(true);
      expect(aesGcmDiaryKeyCrypto.unwrapDek(USER, randomBytes(32), wrapped)).toBeNull();
      expect(aesGcmDiaryKeyCrypto.unwrapDek(USER + 1, kek, wrapped)).toBeNull();
    });

    it('gives a body cipher bound to the user', () => {
      const stored = aesGcmDiaryKeyCrypto.cipherFor(USER, DEK).encrypt('2026-03-04', 'x');
      expect(new AesGcmBodyCipher(USER, DEK).decrypt('2026-03-04', stored)).toBe('x');
    });
  });
});
