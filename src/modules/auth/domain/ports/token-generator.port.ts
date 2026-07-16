/**
 * Domain port for JWT token generation
 * Defines the contract for any token implementation
 */
export interface TokenPayload {
  userId: number;
  username: string;
  role: number;
}

export interface TokenGeneratorPort {
  /**
   * Generates a JWT token
   * @param payload Data to include in the token
   * @returns Generated JWT token
   */
  generate(payload: TokenPayload): string;

  /**
   * Verifies and decodes a JWT token
   * @param token Token to verify
   * @returns Decoded payload or null if invalid
   */
  verify(token: string): TokenPayload | null;

  /**
   * The real lifetime of tokens issued by generate(), in seconds - callers
   * (e.g. the login response's `expiresIn` field) must read this instead of
   * hardcoding a duration, so the two can never drift apart.
   */
  getExpiresInSeconds(): number;
}
