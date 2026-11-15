import { trustProxySetting } from '../../../src/infrastructure/config/trust-proxy';

describe('trustProxySetting (Auth SPEC v0.6, L5)', () => {
  const original = process.env.TRUST_PROXY;
  afterEach(() => {
    if (original === undefined) delete process.env.TRUST_PROXY;
    else process.env.TRUST_PROXY = original;
  });

  it('trusts exactly one proxy hop by default', () => {
    expect(trustProxySetting(undefined)).toBe(1);
    expect(trustProxySetting('  ')).toBe(1);
  });

  it('reads a number of hops', () => {
    expect(trustProxySetting('0')).toBe(0);
    expect(trustProxySetting(' 2 ')).toBe(2);
  });

  it('passes any other value to Express as it is', () => {
    expect(trustProxySetting('loopback')).toBe('loopback');
  });

  it('reads TRUST_PROXY from the environment', () => {
    process.env.TRUST_PROXY = '0';
    expect(trustProxySetting()).toBe(0);
  });
});
