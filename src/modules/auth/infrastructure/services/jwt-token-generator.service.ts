import jwt from 'jsonwebtoken';
import { TokenGeneratorPort, TokenPayload } from '../../domain/ports/token-generator.port';

/**
 * Infrastructure adapter for JWT token generation
 * Implements the TokenGeneratorPort
 */
export class JwtTokenGeneratorService implements TokenGeneratorPort {
  private readonly SECRET_KEY: string;
  // Single source of truth for token lifetime - both the string jwt.sign()
  // needs and the seconds getExpiresInSeconds() reports derive from this one
  // number, so they can't drift apart the way EXPIRES_IN ('30d') and the
  // login response's hardcoded expiresIn (86400 = 24h) previously did.
  private static readonly EXPIRES_IN_DAYS = 30;
  private readonly EXPIRES_IN = `${JwtTokenGeneratorService.EXPIRES_IN_DAYS}d`;

  constructor(secretKey?: string) {
    this.SECRET_KEY = secretKey ?? process.env.SECRET_KEY!;
  }

  generate(payload: TokenPayload): string {
    return jwt.sign(
      {
        userId: payload.userId,
        username: payload.username,
        role: payload.role,
      },
      this.SECRET_KEY,
      { expiresIn: this.EXPIRES_IN }
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
    return JwtTokenGeneratorService.EXPIRES_IN_DAYS * 24 * 60 * 60;
  }
}
