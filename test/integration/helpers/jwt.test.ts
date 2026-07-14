import jwtLib from 'jsonwebtoken';
import { signToken, signAdminToken, bearer, TEST_SECRET_KEY } from './jwt';

describe('integration test jwt helper', () => {
  afterEach(() => {
    delete process.env.SECRET_KEY;
  });

  it('signs a token using process.env.SECRET_KEY when set', () => {
    process.env.SECRET_KEY = 'from-env';

    const token = signToken({ username: 'x' });

    expect(jwtLib.verify(token, 'from-env')).toBeTruthy();
  });

  it('falls back to TEST_SECRET_KEY when SECRET_KEY is unset', () => {
    delete process.env.SECRET_KEY;

    const token = signToken({ username: 'x' });

    expect(jwtLib.verify(token, TEST_SECRET_KEY)).toBeTruthy();
  });

  it('signAdminToken forces role 1', () => {
    process.env.SECRET_KEY = TEST_SECRET_KEY;

    const decoded: any = jwtLib.verify(signAdminToken(), TEST_SECRET_KEY);

    expect(decoded.role).toBe(1);
  });

  it('bearer prefixes the token', () => {
    expect(bearer('abc')).toBe('Bearer abc');
  });
});
