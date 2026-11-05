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

    it('throws when neither an explicit key nor SECRET_KEY is set, rather than falling back to a guessable default', () => {
      delete process.env.SECRET_KEY;
      const service = new JwtTokenGeneratorService();

      expect(() => service.generate({ userId: 3, username: 'defaultuser', role: 2 })).toThrow(
        'secretOrPrivateKey must have a value'
      );
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
    const DAY = 24 * 60 * 60;

    afterEach(() => jest.useRealTimers());

    it.each([
      ['April has 30 days', '2026-04-05T12:00:00Z', '2026-05-05T12:00:00Z', 30],
      ['March has 31 days', '2026-03-05T12:00:00Z', '2026-04-05T12:00:00Z', 31],
      ['February has 28 days', '2027-02-05T12:00:00Z', '2027-03-05T12:00:00Z', 28],
      ['a leap February has 29 days', '2028-02-05T12:00:00Z', '2028-03-05T12:00:00Z', 29],
      ['January 31 ends on the last day of February', '2026-01-31T12:00:00Z', '2026-02-28T12:00:00Z', 28],
      ['January 31 of a leap year', '2028-01-31T12:00:00Z', '2028-02-29T12:00:00Z', 29],
      ['December crosses the year', '2026-12-15T12:00:00Z', '2027-01-15T12:00:00Z', 31],
    ])('lasts one calendar month: %s', (_name, from, to, days) => {
      jest.useFakeTimers({ now: new Date(from), doNotFake: ['nextTick', 'setImmediate'] });
      const service = new JwtTokenGeneratorService('explicit-secret');

      expect(service.getExpiresInSeconds()).toBe(days * DAY);

      // Cross-check against the actual token, not just the number: decode the
      // real exp/iat claims - this is what would have caught the
      // expiresIn/EXPIRES_IN drift bug for real.
      const token = service.generate({ userId: 1, username: 'testuser', role: 2 });
      const decoded = jwt.decode(token) as any;
      expect(decoded.exp).toBe(new Date(to).getTime() / 1000);
      expect(decoded.exp - decoded.iat).toBe(service.getExpiresInSeconds());
    });
  });
});
