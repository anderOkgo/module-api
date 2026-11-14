import { CodePurpose, UserRepository } from '../ports/user.repository';

/** Auth SPEC v0.5, D5 (P6): a code lives 15 minutes, takes 5 wrong tries, and one is sent a minute. */
export const CODE_LIFETIME_SECONDS = 15 * 60;
export const MAX_WRONG_TRIES = 5;
export const RESEND_WAIT_SECONDS = 60;

export type IssueResult = { sent: true; code: number } | { sent: false };
export type CheckResult = 'ok' | 'expired' | 'invalid';

/**
 * The rules every emailed code follows, for registration and password reset alike (D3).
 * Ages come from the database clock, so the API and the table never disagree on time.
 */
export class VerificationCodePolicy {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly random: () => number = Math.random
  ) {}

  /** A new 6-digit code, unless one was sent to this email for this purpose less than a minute ago. */
  async issue(email: string, purpose: CodePurpose): Promise<IssueResult> {
    const latest = await this.userRepository.findVerificationCode(email, purpose);
    if (latest && latest.ageSeconds < RESEND_WAIT_SECONDS) return { sent: false };
    const code = Math.floor(100000 + this.random() * 900000);
    await this.userRepository.saveVerificationCode(email, code, purpose);
    return { sent: true, code };
  }

  /** Checks a typed code; the 5th wrong try deletes it, so a new one must be asked for. */
  async check(email: string, purpose: CodePurpose, typed: unknown): Promise<CheckResult> {
    const stored = await this.userRepository.findVerificationCode(email, purpose);
    if (!stored) return 'invalid';
    if (stored.ageSeconds >= CODE_LIFETIME_SECONDS) return 'expired';
    if (Number(typed) === stored.code) return 'ok';
    if (stored.attempts + 1 >= MAX_WRONG_TRIES) {
      await this.userRepository.deleteVerificationCode(email, purpose);
    } else {
      await this.userRepository.incrementVerificationAttempts(stored.id);
    }
    return 'invalid';
  }
}
