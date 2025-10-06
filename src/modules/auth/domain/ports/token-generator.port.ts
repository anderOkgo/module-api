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
}
