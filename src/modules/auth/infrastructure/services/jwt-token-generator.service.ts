import jwt from 'jsonwebtoken';
import { TokenGeneratorPort, TokenPayload } from '../../domain/ports/token-generator.port';

/**
 * Infrastructure adapter for JWT token generation
 * Implements the TokenGeneratorPort
 */
export class JwtTokenGeneratorService implements TokenGeneratorPort {
  private readonly SECRET_KEY: string;
  private readonly EXPIRES_IN = '30d';

  constructor(secretKey?: string) {
    this.SECRET_KEY = secretKey ?? process.env.SECRET_KEY ?? 'enterkey';
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
}
