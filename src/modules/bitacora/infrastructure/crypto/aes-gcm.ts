import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import { BodyCipher } from '../../application/ports/body-cipher';
import { DiaryKeyCrypto } from '../../application/ports/diary-key.ports';

/**
 * AES-256-GCM for Bitácora (SPEC v1.11 §4.6, D32). Stored format: `v1:` + base64 of
 * (12-byte random IV ‖ 16-byte tag ‖ ciphertext). Additional authenticated data binds each value
 * to where it belongs: `<userId>:<date>` for a body, `user_keys:<userId>` for a wrapped data key.
 * Keys only ever live in memory; nothing here logs or echoes a key or a text.
 */

const FORMAT = 'v1:';
const IV_BYTES = 12;
const TAG_BYTES = 16;
const ALGORITHM = 'aes-256-gcm';

export function seal(key: Buffer, plain: Buffer, aad: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  cipher.setAAD(Buffer.from(aad, 'utf8'));
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  return FORMAT + Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64');
}

/** The plain bytes, or null when `sealed` is not in the format, was changed, or the key or AAD differ. */
export function open(key: Buffer, sealed: string, aad: string): Buffer | null {
  if (typeof sealed !== 'string' || !sealed.startsWith(FORMAT)) return null;
  const raw = Buffer.from(sealed.slice(FORMAT.length), 'base64');
  if (raw.length < IV_BYTES + TAG_BYTES) return null;
  try {
    const decipher = createDecipheriv(ALGORITHM, key, raw.subarray(0, IV_BYTES));
    decipher.setAAD(Buffer.from(aad, 'utf8'));
    decipher.setAuthTag(raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES));
    return Buffer.concat([decipher.update(raw.subarray(IV_BYTES + TAG_BYTES)), decipher.final()]);
  } catch {
    return null;
  }
}

const bodyAad = (userId: number, date: string) => `${userId}:${date}`;
const dekAad = (userId: number) => `user_keys:${userId}`;

/** Thrown when a stored body does not decrypt; carries no text (N2). */
export class UndecryptableBodyError extends Error {
  constructor() {
    super('An entry body cannot be decrypted');
    this.name = 'UndecryptableBodyError';
  }
}

export class AesGcmBodyCipher implements BodyCipher {
  constructor(private readonly userId: number, private readonly dek: Buffer) {}

  encrypt(date: string, plain: string): string {
    return seal(this.dek, Buffer.from(plain, 'utf8'), bodyAad(this.userId, date));
  }

  decrypt(date: string, stored: string): string {
    const plain = open(this.dek, stored, bodyAad(this.userId, date));
    if (!plain) throw new UndecryptableBodyError();
    return plain.toString('utf8');
  }
}

export const aesGcmDiaryKeyCrypto: DiaryKeyCrypto = {
  generateDek: () => randomBytes(32),
  wrapDek: (userId, kek, dek) => seal(kek, dek, dekAad(userId)),
  unwrapDek: (userId, kek, wrappedDek) => open(kek, wrappedDek, dekAad(userId)),
  cipherFor: (userId, dek) => new AesGcmBodyCipher(userId, dek),
};
