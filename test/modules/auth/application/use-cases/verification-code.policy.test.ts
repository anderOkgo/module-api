import {
  VerificationCodePolicy,
  CODE_LIFETIME_SECONDS,
  MAX_WRONG_TRIES,
  RESEND_WAIT_SECONDS,
} from '../../../../../src/modules/auth/application/use-cases/verification-code.policy';
import { UserRepository } from '../../../../../src/modules/auth/application/ports/user.repository';

const repo = {
  findVerificationCode: jest.fn(),
  saveVerificationCode: jest.fn(),
  incrementVerificationAttempts: jest.fn(),
  deleteVerificationCode: jest.fn(),
} as unknown as jest.Mocked<UserRepository>;

const stored = (over = {}) => ({ id: 3, code: 123456, attempts: 0, ageSeconds: 10, ...over });

describe('VerificationCodePolicy (Auth SPEC v0.5, D5)', () => {
  beforeEach(() => jest.resetAllMocks());

  it('uses the agreed numbers: 15 minutes, 5 tries, one a minute (P6)', () => {
    expect(CODE_LIFETIME_SECONDS).toBe(900);
    expect(MAX_WRONG_TRIES).toBe(5);
    expect(RESEND_WAIT_SECONDS).toBe(60);
  });

  describe('issue', () => {
    it('stores and returns a new 6-digit code when none is pending', async () => {
      const policy = new VerificationCodePolicy(repo, () => 0.5);
      repo.findVerificationCode.mockResolvedValue(null);

      expect(await policy.issue('a@example.com', 'reset')).toEqual({ sent: true, code: 550000 });
      expect(repo.saveVerificationCode).toHaveBeenCalledWith('a@example.com', 550000, 'reset');
    });

    it('keeps codes within 100000-999999 with the default random source', async () => {
      const policy = new VerificationCodePolicy(repo);
      repo.findVerificationCode.mockResolvedValue(null);
      const result = await policy.issue('a@example.com', 'register');
      expect(result.sent).toBe(true);
      const code = (result as { code: number }).code;
      expect(code).toBeGreaterThanOrEqual(100000);
      expect(code).toBeLessThanOrEqual(999999);
    });

    it('sends nothing within a minute of the last code, and again from 60 seconds', async () => {
      const policy = new VerificationCodePolicy(repo, () => 0);
      repo.findVerificationCode.mockResolvedValueOnce(stored({ ageSeconds: 59 }));
      expect(await policy.issue('a@example.com', 'register')).toEqual({ sent: false });
      expect(repo.saveVerificationCode).not.toHaveBeenCalled();

      repo.findVerificationCode.mockResolvedValueOnce(stored({ ageSeconds: 60 }));
      expect(await policy.issue('a@example.com', 'register')).toEqual({ sent: true, code: 100000 });
    });
  });

  describe('check', () => {
    const policy = new VerificationCodePolicy(repo);

    it('accepts the right code, typed as a number or a string', async () => {
      repo.findVerificationCode.mockResolvedValue(stored());
      expect(await policy.check('a@example.com', 'register', 123456)).toBe('ok');
      expect(await policy.check('a@example.com', 'register', '123456')).toBe('ok');
    });

    it('is invalid when there is no code', async () => {
      repo.findVerificationCode.mockResolvedValue(null);
      expect(await policy.check('a@example.com', 'reset', 123456)).toBe('invalid');
    });

    it('is expired from 15 minutes, even with the right code (E1)', async () => {
      repo.findVerificationCode.mockResolvedValue(stored({ ageSeconds: CODE_LIFETIME_SECONDS }));
      expect(await policy.check('a@example.com', 'register', 123456)).toBe('expired');
      repo.findVerificationCode.mockResolvedValue(stored({ ageSeconds: CODE_LIFETIME_SECONDS - 1 }));
      expect(await policy.check('a@example.com', 'register', 123456)).toBe('ok');
    });

    it('counts a wrong try', async () => {
      repo.findVerificationCode.mockResolvedValue(stored({ attempts: 3 }));
      expect(await policy.check('a@example.com', 'register', 111111)).toBe('invalid');
      expect(repo.incrementVerificationAttempts).toHaveBeenCalledWith(3);
      expect(repo.deleteVerificationCode).not.toHaveBeenCalled();
    });

    it('deletes the code on the 5th wrong try (E4)', async () => {
      repo.findVerificationCode.mockResolvedValue(stored({ attempts: 4 }));
      expect(await policy.check('a@example.com', 'reset', 'not a code')).toBe('invalid');
      expect(repo.deleteVerificationCode).toHaveBeenCalledWith('a@example.com', 'reset');
      expect(repo.incrementVerificationAttempts).not.toHaveBeenCalled();
    });
  });
});
