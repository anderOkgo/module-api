import { BodyCipher } from './body-cipher';

/**
 * One row of `user_keys` (SPEC v1.11 §4.6): how the device derives its key from the passphrase,
 * and the data key wrapped by that key. Nothing here opens the diary without the passphrase.
 */
export interface UserKeyRecord {
  kdf: string;
  iterations: number;
  /** base64url, 16 bytes made on the device; not secret. */
  salt: string;
  /** `v1:` + base64 of the data key sealed with the key derived from the passphrase. */
  wrappedDek: string;
}

/** Persistence of `user_keys`, scoped to one `userId` per call (D8). */
export interface UserKeyRepository {
  findKey(userId: number): Promise<UserKeyRecord | null>;
  /** Inserts the user's key; false when the user already has one (nothing written). */
  createKey(userId: number, record: UserKeyRecord): Promise<boolean>;
  /** Replaces the user's key parameters and wrapped data key (C17). */
  replaceKey(userId: number, record: UserKeyRecord): Promise<void>;
}

/**
 * The cryptography the key use cases need, kept behind a port so the application layer stays
 * free of `crypto`. `kek` is the 32-byte key the device derived from the passphrase; `dek` is the
 * 32-byte data key that encrypts the bodies.
 */
export interface DiaryKeyCrypto {
  generateDek(): Buffer;
  wrapDek(userId: number, kek: Buffer, dek: Buffer): string;
  /** The data key, or null when `kek` does not open `wrappedDek` (a wrong passphrase). */
  unwrapDek(userId: number, kek: Buffer, wrappedDek: string): Buffer | null;
  cipherFor(userId: number, dek: Buffer): BodyCipher;
}
