import jwt from 'jsonwebtoken';
import { TokenGeneratorPort, TokenPayload } from '../../domain/ports/token-generator.port';

/**
 * Infrastructure adapter for JWT token generation
 * Implements the TokenGeneratorPort
 */
export class JwtTokenGeneratorService implements TokenGeneratorPort {
  private readonly SECRET_KEY: string;
  constructor(secretKey?: string) {
    this.SECRET_KEY = secretKey ?? process.env.SECRET_KEY!;
  }

  generate(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
        exp: JwtTokenGeneratorService.expiresAt(new Date()),
      },
      this.SECRET_KEY
    );
  }

  verify(token: string): TokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.SECRET_KEY) as any;
      return {
        userId: decoded.userId,
        username: decoded.username,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }

  getExpiresInSeconds(): number {
    const now = new Date();
    return JwtTokenGeneratorService.expiresAt(now) - Math.floor(now.getTime() / 1000);
  }

  /**
   * Single source of truth for token lifetime: one calendar month, in UTC, so
   * 28 to 31 days. The same day of the next month, or its last day when that
   * month is shorter (January 31 -> February 28). generate() and
   * getExpiresInSeconds() both read this, so they can't drift apart the way
   * EXPIRES_IN ('30d') and a hardcoded expiresIn (86400) once did.
   */
  private static expiresAt(now: Date): number {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth();
    const lastDayOfNextMonth = new Date(Date.UTC(year, month + 2, 0)).getUTCDate();
    const day = Math.min(now.getUTCDate(), lastDayOfNextMonth);
    const end = Date.UTC(year, month + 1, day, now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds());
    return Math.floor(end / 1000);
  }
}
