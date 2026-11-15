import {
  IpAttemptLimiter,
  IP_WINDOW_MS,
  MAX_IP_FAILURES,
  isUnknownAddress,
} from '../../../../../src/modules/auth/application/use-cases/ip-attempt.limiter';

describe('IpAttemptLimiter (Auth SPEC v0.6)', () => {
  let clock: number;
  let limiter: IpAttemptLimiter;
  const now = () => clock;

  beforeEach(() => {
    clock = 1_000_000;
    limiter = new IpAttemptLimiter(now);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => jest.restoreAllMocks());

  const fail = (ip: string, times: number) => {
    for (let i = 0; i < times; i++) limiter.recordFailure(ip);
  };

  it('uses the agreed numbers: 20 failures in 15 minutes (P11)', () => {
    expect(MAX_IP_FAILURES).toBe(20);
    expect(IP_WINDOW_MS).toBe(15 * 60 * 1000);
  });

  it('blocks an IP after its 20th failure, not before (F1)', () => {
    fail('203.0.113.7', 19);
    expect(limiter.isBlocked('203.0.113.7')).toBe(false);
    limiter.recordFailure('203.0.113.7');
    expect(limiter.isBlocked('203.0.113.7')).toBe(true);
  });

  it('counts each IP on its own (F3)', () => {
    fail('203.0.113.7', 19);
    fail('198.51.100.2', 1);
    expect(limiter.isBlocked('203.0.113.7')).toBe(false);
    expect(limiter.isBlocked('198.51.100.2')).toBe(false);
  });

  it('lets the IP back in 15 minutes after its first counted failure (F2)', () => {
    fail('203.0.113.7', 1);
    clock += 5 * 60 * 1000;
    fail('203.0.113.7', 19);
    expect(limiter.isBlocked('203.0.113.7')).toBe(true);

    clock += 10 * 60 * 1000 - 1;
    expect(limiter.isBlocked('203.0.113.7')).toBe(true);
    clock += 1;
    expect(limiter.isBlocked('203.0.113.7')).toBe(false);
  });

  it('starts a new window once the old one is over', () => {
    fail('203.0.113.7', 19);
    clock += IP_WINDOW_MS;
    limiter.recordFailure('203.0.113.7');
    expect(limiter.isBlocked('203.0.113.7')).toBe(false);
    fail('203.0.113.7', 19);
    expect(limiter.isBlocked('203.0.113.7')).toBe(true);
  });

  it('drops expired IPs when a failure is recorded, so memory stays bounded (S.5)', () => {
    fail('203.0.113.7', 1);
    fail('198.51.100.2', 1);
    expect(limiter.size).toBe(2);
    clock += IP_WINDOW_MS;
    limiter.recordFailure('192.0.2.1');
    expect(limiter.size).toBe(1);
  });

  it('logs once when an IP reaches the limit, without the IP (S.5)', () => {
    fail('203.0.113.7', 25);
    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledWith('IP limit reached');
  });

  it('never limits an address it cannot tell apart from other clients', () => {
    for (const ip of [undefined, '', '127.0.0.1', '::1', '::ffff:127.0.0.1']) {
      fail(ip as string, 30);
      expect(limiter.isBlocked(ip)).toBe(false);
    }
    expect(limiter.size).toBe(0);
  });

  it('isUnknownAddress tells loopback and missing addresses from real ones', () => {
    expect(isUnknownAddress(undefined)).toBe(true);
    expect(isUnknownAddress('127.0.0.5')).toBe(true);
    expect(isUnknownAddress('::ffff:127.0.0.1')).toBe(true);
    expect(isUnknownAddress('203.0.113.7')).toBe(false);
    expect(isUnknownAddress('::ffff:203.0.113.7')).toBe(false);
  });

  it('works with the real clock by default', () => {
    const real = new IpAttemptLimiter();
    for (let i = 0; i < MAX_IP_FAILURES; i++) real.recordFailure('203.0.113.7');
    expect(real.isBlocked('203.0.113.7')).toBe(true);
  });
});
