/* eslint-disable */
/**
 * E2E — Auth limit per IP (module-docs/apps/auth/SPEC.md v0.6, S.6 rows F1, F3, F4, F5 with layer API,
 * and F7 on the source). Doc: docs/changes/20261115-auth-ip-limit.md
 *
 * Requires:
 *   - the API on E2E_BASE_URL (default http://localhost:3001), built from this branch, started with
 *     EMAILHOST pointing at a host that does not exist (no email leaves the machine) and the default
 *     TRUST_PROXY (one hop), so X-Forwarded-For names the client as the production proxy does;
 *   - MYHOST / MYPORT / MYUSER / MYPASSWORD / MYDATABASEAUTH (from .env) — the LOCAL database only.
 * Usage: node scripts/20261115-e2e-auth-ip-limit.js
 *
 * Each case uses its own made-up client IP from the benchmark range 198.18.0.0/15, picked per run, so
 * runs never share a count. F2 (15 minutes later) is proven by the unit tests with a fake clock.
 * Data: one throwaway account per run (`e2eipNNNNNNN`, `e2e_ip_NNNNNNN@example.com`), deleted at the end.
 * Expected 4xx on purpose: 400 (wrong passwords and codes), 429 (over the limit).
 * Negative control (F8): against a build without the limiter, F1 must FAIL.
 */
const fs = require('fs');
const path = require('path');
const { check, section, http, withDb, onCleanup, run } = require('./_e2e-helpers');

const suffix = Date.now().toString().slice(-7);
const username = `e2eip${suffix}`;
const email = `e2e_ip_${suffix}@example.com`;
const password = 'RightPass123';
const block = Math.floor(Math.random() * 250);
const ipFor = (n) => `198.18.${block}.${n}`;

const db = (sql, params) => withDb('MYDATABASEAUTH', (q) => q(sql, params));
const login = (ip, user, pass) =>
  http('POST', '/api/users/login', { headers: { 'x-forwarded-for': ip }, body: { username: user, password: pass } });
const ghost = (i) => `e2eghost${suffix}${i % 5}`;

run(async () => {
  onCleanup(async () => {
    await db('DELETE FROM email_verification WHERE email = ?', [email]);
    await db('DELETE FROM users WHERE email = ?', [email]);
  });

  section('Setup — one throwaway account');
  const ask = await http('POST', '/api/users/add', {
    headers: { 'x-forwarded-for': ipFor(1) },
    body: { username, email, password, first_name: '', last_name: '' },
  });
  check('setup: a register code is sent (201)', ask.status === 201, ask);
  const [{ code }] = await db(
    'SELECT verification_code AS code FROM email_verification WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1',
    [email, 'register']
  );
  const made = await http('POST', '/api/users/add', {
    headers: { 'x-forwarded-for': ipFor(1) },
    body: { username, email, password, first_name: '', last_name: '', verificationCode: code },
  });
  check('setup: the account is created (201)', made.status === 201, made);

  section('F1 — 20 wrong passwords over 5 accounts, then the right one for a 6th → 429');
  let all400 = true;
  for (let i = 0; i < 20; i++) all400 = (await login(ipFor(10), ghost(i), 'wrong')).status === 400 && all400;
  check('F1 the 20 failures get normal 400 answers', all400);
  const f1 = await login(ipFor(10), username, password);
  check('F1 the 21st request gets 429, even with the right password', f1.status === 429, f1);
  check('F1 … with the agreed message', f1.body?.message === 'Too many attempts, try again later', f1.body);
  const [row] = await db('SELECT login_attempts, locked_until FROM users WHERE email = ?', [email]);
  check('F1 the IP limit locked no account', row.locked_until === null && Number(row.login_attempts) === 0, row);

  section('F3 — 19 failures from IP A and 1 from IP B still get normal answers');
  for (let i = 0; i < 19; i++) await login(ipFor(20), ghost(i), 'wrong');
  await login(ipFor(21), ghost(0), 'wrong');
  const a = await login(ipFor(20), username, password);
  const b = await login(ipFor(21), username, password);
  check('F3 IP A still logs in (200)', a.status === 200, a.status);
  check('F3 IP B still logs in (200)', b.status === 200, b.status);

  section('F4 — wrong passwords and wrong codes add up to the same 20');
  for (let i = 0; i < 10; i++) await login(ipFor(30), ghost(i), 'wrong');
  for (let i = 0; i < 5; i++) {
    await http('POST', '/api/users/password-reset/confirm', {
      headers: { 'x-forwarded-for': ipFor(30) },
      body: { email, code: 100000 + i, newPassword: 'OtherPass456' },
    });
  }
  for (let i = 0; i < 5; i++) {
    await http('POST', '/api/users/add', {
      headers: { 'x-forwarded-for': ipFor(30) },
      body: { username: `e2eipx${suffix}`, email: `e2e_ipx_${suffix}@example.com`, password, verificationCode: 100000 + i },
    });
  }
  const f4 = await login(ipFor(30), username, password);
  check('F4 after 10 + 5 + 5 mixed failures, login gets 429', f4.status === 429, f4.status);
  const f4c = await http('POST', '/api/users/password-reset/confirm', {
    headers: { 'x-forwarded-for': ipFor(30) },
    body: { email, code: 123456, newPassword: 'OtherPass456' },
  });
  check('F4 … and C5 gets 429 too', f4c.status === 429, f4c.status);
  const f4r = await http('POST', '/api/users/password-reset/request', {
    headers: { 'x-forwarded-for': ipFor(30) },
    body: { email: `e2e_ipnobody_${suffix}@example.com` },
  });
  check('F4 … while C4 (no secret) still answers 200', f4r.status === 200, f4r.status);

  section('F5 — a correct login after 10 failures does not reset the count');
  for (let i = 0; i < 10; i++) await login(ipFor(40), ghost(i), 'wrong');
  const ok = await login(ipFor(40), username, password);
  check('F5 the correct login works (200)', ok.status === 200, ok.status);
  for (let i = 0; i < 10; i++) await login(ipFor(40), ghost(i), 'wrong');
  const f5 = await login(ipFor(40), username, password);
  check('F5 10 more failures reach the limit: 429', f5.status === 429, f5.status);

  section('F7 — the dead methods are gone from the auth module');
  const read = (p) => fs.readFileSync(path.join(__dirname, '..', 'src', 'modules', 'auth', p), 'utf8');
  const port = read('application/ports/user.repository.ts');
  const mysql = read('infrastructure/persistence/user.mysql.ts');
  check('F7 unlockUser is not in the port or MySQL', !/unlockUser/.test(port + mysql));
  check('F7 update(user) and delete(id) are not in the port', !/^\s*(update|delete)\(/m.test(port));
  check('F7 … nor in MySQL', !/^\s*async (update|delete)\(/m.test(mysql));
});
