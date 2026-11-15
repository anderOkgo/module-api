/**
 * Auth SPEC v0.6 (P11): one IP may fail 20 times in 15 minutes across the public routes that check a
 * secret (a wrong password on login, a wrong code on registration or password reset). After that it
 * is refused until 15 minutes have passed since its first counted failure. No IP is exempt (P12).
 */
export const MAX_IP_FAILURES = 20;
export const IP_WINDOW_MS = 15 * 60 * 1000;

type Entry = { first: number; count: number };

/**
 * An address the API cannot tell apart from other clients: none at all, or the loopback the proxy
 * connects from when it does not forward the client's address. Counting it would put every client
 * in one bucket and lock everyone out, so it is never limited (S.5).
 */
export function isUnknownAddress(ip: string | undefined): boolean {
  if (!ip) return true;
  return ip === '::1' || ip.startsWith('127.') || ip.startsWith('::ffff:127.');
}

/**
 * Counts failures per IP in memory (D8): a restart clears the counts, and entries older than the
 * window are dropped whenever a failure is recorded, so memory stays bounded.
 */
export class IpAttemptLimiter {
  private readonly failures = new Map<string, Entry>();

  constructor(
    private readonly now: () => number = Date.now,
    private readonly maxFailures: number = MAX_IP_FAILURES,
    private readonly windowMs: number = IP_WINDOW_MS
  ) {}

  /** True when this IP has used up its failures in the current window. */
  isBlocked(ip: string | undefined): boolean {
    const entry = this.current(ip);
    return entry !== undefined && entry.count >= this.maxFailures;
  }

  /** Counts one failure for this IP. A success never resets the count (S.2). */
  recordFailure(ip: string | undefined): void {
    if (isUnknownAddress(ip)) return;
    this.dropExpired();
    const entry = this.current(ip) ?? { first: this.now(), count: 0 };
    entry.count += 1;
    this.failures.set(ip as string, entry);
    if (entry.count === this.maxFailures) {
      // No IP and no account in the log (S.5)
      console.warn('IP limit reached');
    }
  }

  /** How many IPs are being counted; for tests of the memory bound. */
  get size(): number {
    return this.failures.size;
  }

  private current(ip: string | undefined): Entry | undefined {
    if (isUnknownAddress(ip)) return undefined;
    const entry = this.failures.get(ip as string);
    if (entry && this.now() - entry.first >= this.windowMs) {
      this.failures.delete(ip as string);
      return undefined;
    }
    return entry;
  }

  private dropExpired(): void {
    const now = this.now();
    for (const [ip, entry] of this.failures) {
      if (now - entry.first >= this.windowMs) this.failures.delete(ip);
    }
  }
}
