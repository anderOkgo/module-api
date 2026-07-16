import jwt from 'jsonwebtoken';
import { JwtTokenGeneratorService } from '../../../../../src/modules/auth/infrastructure/services/jwt-token-generator.service';

describe('JwtTokenGeneratorService', () => {
  const originalSecret = process.env.SECRET_KEY;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SECRET_KEY;
    else process.env.SECRET_KEY = originalSecret;
  });

  describe('generate', () => {
    it('signs a token using an explicitly provided secret key', () => {
      const service = new JwtTokenGeneratorService('explicit-secret');

      const token = service.generate({ userId: 1, username: 'testuser', role: 2 });

      const decoded = jwt.verify(token, 'explicit-secret') as any;
      expect(decoded).toEqual(expect.objectContaining({ userId: 1, username: 'testuser', role: 2 }));
    });

    it('falls back to process.env.SECRET_KEY when no key is passed', () => {
      process.env.SECRET_KEY = 'env-secret';
      const service = new JwtTokenGeneratorService();

      const token = service.generate({ userId: 2, username: 'envuser', role: 1 });

      const decoded = jwt.verify(token, 'env-secret') as any;
      expect(decoded.username).toBe('envuser');
    });

    it('falls back to the default secret when neither an explicit key nor SECRET_KEY is set', () => {
      delete process.env.SECRET_KEY;
      const service = new JwtTokenGeneratorService();

      const token = service.generate({ userId: 3, username: 'defaultuser', role: 2 });

      const decoded = jwt.verify(token, 'enterkey') as any;
      expect(decoded.username).toBe('defaultuser');
    });
  });

  describe('verify', () => {
    it('returns the decoded payload for a valid token', () => {
      const service = new JwtTokenGeneratorService('verify-secret');
      const token = service.generate({ userId: 5, username: 'verifieduser', role: 1 });

      const result = service.verify(token);

      expect(result).toEqual({ userId: 5, username: 'verifieduser', role: 1 });
    });

    it('returns null for an invalid token', () => {
      const service = new JwtTokenGeneratorService('verify-secret');

      expect(service.verify('not-a-real-token')).toBeNull();
    });

    it('returns null for a token signed with a different secret', () => {
      const service = new JwtTokenGeneratorService('verify-secret');
      const foreignToken = jwt.sign({ userId: 1, username: 'x', role: 1 }, 'other-secret');

      expect(service.verify(foreignToken)).toBeNull();
    });
  });

  describe('getExpiresInSeconds', () => {
    it('returns 30 days in seconds, matching the real lifetime generate() signs tokens with', () => {
      const service = new JwtTokenGeneratorService('explicit-secret');

      expect(service.getExpiresInSeconds()).toBe(30 * 24 * 60 * 60);

      // Cross-check against the actual token, not just the constant: decode
      // the real exp/iat claims and confirm they're 30 days apart - this is
      // what would have caught the expiresIn/EXPIRES_IN drift bug for real.
      const token = service.generate({ userId: 1, username: 'testuser', role: 2 });
      const decoded = jwt.verify(token, 'explicit-secret') as any;
      expect(decoded.exp - decoded.iat).toBe(service.getExpiresInSeconds());
    });
  });
});
