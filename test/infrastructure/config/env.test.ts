import { assertRequiredEnvVars } from '../../../src/infrastructure/config/env';

describe('assertRequiredEnvVars', () => {
  const originalSecret = process.env.SECRET_KEY;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.SECRET_KEY;
    else process.env.SECRET_KEY = originalSecret;
  });

  it('does not throw when SECRET_KEY is set', () => {
    process.env.SECRET_KEY = 'a-real-secret';

    expect(() => assertRequiredEnvVars()).not.toThrow();
  });

  it('throws when SECRET_KEY is missing', () => {
    delete process.env.SECRET_KEY;

    expect(() => assertRequiredEnvVars()).toThrow(/SECRET_KEY/);
  });

  it('throws when SECRET_KEY is set to an empty string', () => {
    process.env.SECRET_KEY = '';

    expect(() => assertRequiredEnvVars()).toThrow(/SECRET_KEY/);
  });
});
