/* eslint-disable */
/**
 * E2E — Auth codes that expire and password reset by email (module-docs/apps/auth/SPEC.md v0.5,
 * R.6 rows E1–E9 with layer API). Doc: docs/changes/20261114-auth-codes-and-reset.md
 *
 * Requires:
 *   - the API on E2E_BASE_URL (default http://localhost:3001), built from this branch, started with
 *     EMAILHOST pointing at a host that does not exist, so no email is ever sent (codes are read
 *     from the local database instead);
 *   - MYHOST / MYPORT / MYUSER / MYPASSWORD / MYDATABASEAUTH (from .env) — the LOCAL database only;
 *   - optional E2E_SERVER_LOG: path of the server's captured output, grepped for codes and emails (E9).
 * Usage: node scripts/20261114-e2e-auth-codes-and-reset.js
 *
 * Data: one throwaway account per run (`e2eNNNNNNNN`, `e2e_codes_NNNNNNNN@example.com`) and its
 * codes; both deleted at the end. Expected 4xx on purpose: 400 (E1, E2, E4, E8), 429 (E3).
 * Negative control (E11): against a build without the expiry check, E1 must FAIL.
 */
const fs = require('fs');
const { check, section, http, withDb, onCleanup, run } = require('./_e2e-helpers');

const suffix = Date.now().toString().slice(-8);
const username = `e2e${suffix}`;
const email = `e2e_codes_${suffix}@example.com`;
const nobody = `e2e_nobody_${suffix}@example.com`;
const password = 'FirstPass123';
const newPassword = 'SecondPass456';

const db = (sql, params) => withDb('MYDATABASEAUTH', (q) => q(sql, params));
const codeOf = async (address, purpose) => {
  const rows = await db(
    'SELECT verification_code AS code, attempts FROM email_verification WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1',
    [address, purpose]
  );
  return rows[0] || null;
};
// Moves a code back in time instead of waiting (local database only)
const age = (address, purpose, minutes) =>
  db('UPDATE email_verification SET created_at = NOW() - INTERVAL ? MINUTE WHERE email = ? AND purpose = ?', [
    minutes,
    address,
    purpose,
  ]);
const register = (extra = {}) =>
  http('POST', '/api/users/add', { body: { username, email, password, first_name: '', last_name: '', ...extra } });
const login = (pass) => http('POST', '/api/users/login', { body: { username, password: pass } });

run(async () => {
  onCleanup(async () => {
    await db('DELETE FROM email_verification WHERE email IN (?, ?)', [email, nobody]);
    await db('DELETE FROM users WHERE email = ?', [email]);
  });

  section('E3 — one register code a minute');
  const first = await register();
  check('E3 first request sends a code (201)', first.status === 201 && first.body?.message === 'Verification code sent', first);
  const again = await register();
  check('E3 a second request within 60 s gets 429', again.status === 429, again);
  check(
    'E3 … with the agreed message',
    again.body?.message === 'Too many requests, try again in a minute' && again.body?.status === undefined,
    again.body
  );

  section('E2 — a new code replaces the old one');
  const oldCode = (await codeOf(email, 'register')).code;
  await age(email, 'register', 2);
  const resent = await register();
  check('E2 after a minute a new code is sent', resent.status === 201, resent);
  const newCode = (await codeOf(email, 'register')).code;
  const rows = await db('SELECT COUNT(*) AS n FROM email_verification WHERE email = ? AND purpose = ?', [email, 'register']);
  check('E2 only one code is kept for the email', rows[0].n === 1, rows);
  if (oldCode !== newCode) {
    const withOld = await register({ verificationCode: oldCode });
    check('E2 the first code is refused', withOld.status === 400 && withOld.body?.message === 'Invalid verification code', withOld);
  }

  section('E4 — 5 wrong tries delete the code');
  for (let i = 1; i <= 5; i++) {
    const wrong = await register({ verificationCode: 100000 + ((newCode + i) % 900000) });
    check(`E4 wrong try ${i} is refused`, wrong.status === 400, wrong);
  }
  check('E4 the code is gone after the 5th wrong try', (await codeOf(email, 'register')) === null);
  const lateRight = await register({ verificationCode: newCode });
  check('E4 the right code no longer works', lateRight.status === 400, lateRight);

  section('E1 — a code older than 15 minutes is expired');
  await age(email, 'register', 2); // let a new code be sent
  await register();
  const fresh = (await codeOf(email, 'register')).code;
  await age(email, 'register', 16);
  const expired = await register({ verificationCode: fresh });
  check('E1 a 16-minute-old code says "Verification code expired"', expired.body?.message === 'Verification code expired', expired);
  const noUser = await db('SELECT COUNT(*) AS n FROM users WHERE email = ?', [email]);
  check('E1 … and no user is created', noUser[0].n === 0, noUser);

  section('Register with a fresh code');
  await register();
  const good = (await codeOf(email, 'register')).code;
  const created = await register({ verificationCode: String(good) });
  check('the right fresh code creates the user (201)', created.status === 201 && created.body?.message === 'User created successfully', created);
  check('the used code is deleted', (await codeOf(email, 'register')) === null);

  section('E5 — no account, same answer');
  const forReal = await http('POST', '/api/users/password-reset/request', { body: { email } });
  const forNobody = await http('POST', '/api/users/password-reset/request', { body: { email: nobody } });
  check('E5 both answers are 200 and identical', forReal.status === 200 && JSON.stringify(forReal.body) === JSON.stringify(forNobody.body), [forReal, forNobody]);
  check('E5 no code is stored for the email with no account', (await codeOf(nobody, 'reset')) === null);
  const quick = await http('POST', '/api/users/password-reset/request', { body: { email } });
  check('E5 a second request within a minute gets the same 200 (D6)', quick.status === 200 && JSON.stringify(quick.body) === JSON.stringify(forReal.body), quick);
  const bad = await http('POST', '/api/users/password-reset/request', { body: { email: 'not-an-email' } });
  check('a malformed email gets 400', bad.status === 400, bad);

  section('E8 — a register code does not reset');
  await db('INSERT INTO email_verification (email, verification_code, purpose) VALUES (?, ?, ?)', [email, 135790, 'register']);
  const crossed = await http('POST', '/api/users/password-reset/confirm', { body: { email, code: 135790, newPassword } });
  check('E8 "Invalid or expired code"', crossed.status === 400 && crossed.body?.message === 'Invalid or expired code', crossed);

  section('E7 + E6 — a locked account is reset with the code');
  for (let i = 0; i < 5; i++) await login('wrong-password');
  const locked = await db('SELECT locked_until IS NOT NULL AS locked FROM users WHERE email = ?', [email]);
  check('E7 five failed logins lock the account', locked[0].locked === 1, locked);
  const resetCode = (await codeOf(email, 'reset')).code;
  const short = await http('POST', '/api/users/password-reset/confirm', { body: { email, code: resetCode, newPassword: '123' } });
  check('a new password under 6 characters gets 400', short.status === 400, short);
  const done = await http('POST', '/api/users/password-reset/confirm', { body: { email, code: resetCode, newPassword } });
  check('E6 the right code changes the password (200)', done.status === 200 && done.body?.message === 'Password changed', done);
  check('E6 the reset code is deleted', (await codeOf(email, 'reset')) === null);
  const oldLogin = await login(password);
  check('E6 the old password no longer logs in', oldLogin.status === 400, oldLogin);
  const newLogin = await login(newPassword);
  check('E6 + E7 the new password logs in at once (lock cleared)', newLogin.status === 200 && !!newLogin.body?.token, newLogin.status);
  const reused = await http('POST', '/api/users/password-reset/confirm', { body: { email, code: resetCode, newPassword: 'ThirdPass789' } });
  check('E6 the code cannot be used twice', reused.status === 400, reused);

  section('E9 — no code or email in the server log');
  const logPath = process.env.E2E_SERVER_LOG;
  if (!logPath) {
    check('E9 needs E2E_SERVER_LOG (the server output)', false);
  } else {
    const log = fs.readFileSync(logPath, 'utf8');
    check('E9 the log does not contain the codes', ![oldCode, newCode, fresh, good, resetCode].some((c) => log.includes(String(c))));
    check('E9 the log does not contain the email', !log.includes(email));
    check('E9 the log says a code was sent', log.includes('Verification code sent') && log.includes('Password reset code sent'));
  }
});
