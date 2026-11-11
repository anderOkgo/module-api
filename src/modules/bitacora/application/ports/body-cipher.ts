/**
 * Encrypts and decrypts entry bodies for one user and one request (SPEC v1.11 §4.6, D32).
 * An instance holds that user's data key in memory only for the request that built it.
 * Every body the repository writes goes through `encrypt`, every body it reads through
 * `decrypt`; the date is bound to the ciphertext, so a body moved to another date or user
 * does not decrypt.
 */
export interface BodyCipher {
  /** The stored form of `plain` for `date` (`v1:` + base64). */
  encrypt(date: string, plain: string): string;
  /** The plain text of a stored body; throws, without echoing any text, when it does not decrypt. */
  decrypt(date: string, stored: string): string;
}
