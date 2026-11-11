/* eslint-disable */
/**
 * E2E — Bitácora diary key and encryption at rest (module-docs/apps/bitacora/SPEC.md v1.11 §6.12,
 * rows K1–K7 and K9 with layer API). Doc: docs/changes/20261111-bitacora-encryption.md
 *
 * Requires (as the other Bitácora E2E scripts):
 *   - the API on E2E_BASE_URL (default http://localhost:3001), built from this branch;
 *   - the two LOCAL test users in .env.e2e.local: E2E_USER_A / E2E_PASSWORD_A, E2E_USER_B / E2E_PASSWORD_B;
 *   - MYHOST / MYPORT / MYUSER / MYPASSWORD / MYDATABASEBITACORA (from .env) for the SQL checks — local only;
 *   - optional E2E_SERVER_LOG: path of the server's captured output, grepped for text and keys (N2).
 * Usage: node scripts/20261111-e2e-bitacora-encryption.js
 *
 * Data: only the two test users' rows (entries, trash, user_keys) are touched; wiped at start and end.
 * Passphrases are invented. Nothing secret is printed: texts carry a random marker, keys are never
 * logged, and the run's own output (and the server log) is grepped for both at the end (K9).
 * Expected 4xx on purpose: 401 (S1), 403 KEY_WRONG (K4, K6), 404 (K2, K7), 409 (K2), 428 (K1).
 * Expected 500 on purpose: K5 (a body moved by SQL to another date no longer decrypts).
 * Negative controls (§6.9): K3 and K4 must FAIL against a build that stores bodies in clear or skips
 * the key check.
 */
const fs = require('fs');
const crypto = require('crypto');
const {
  BASE_URL,
  check,
  section,
  http,
  login,
  tokenUserId,
  withDb,
  onCleanup,
  run,
  openDiary,
  deriveKey,
  toBase64url,
  E2E_PASSPHRASE,
} = require('./_e2e-helpers');

// ── K9: keep everything this run prints, to grep it at the end ──
const output = [];
for (const level of ['log', 'error']) {
  const original = console[level];
  console[level] = (...args) => {
    output.push(args.join(' '));
    original(...args);
  };
}

const MARKER = `e2e-secret-${Math.random().toString(36).slice(2, 10)}`;
const text = (label) => `${MARKER} ${label} — a private line, with an accent: Bogotá.`;
const NEW_PASSPHRASE = `${E2E_PASSPHRASE} — changed`;
const B = '/api/bitacora';
const NO_KEY = { 'x-bitacora-key': undefined };
const randomKey = () => toBase64url(crypto.randomBytes(32));
const keysSeen = [];

run(async () => {
  section('0. Setup — log in both test users, wipe their rows and keys');
  const tokenA = await login(process.env.E2E_USER_A, process.env.E2E_PASSWORD_A);
  const tokenB = await login(process.env.E2E_USER_B, process.env.E2E_PASSWORD_B);
  const userA = tokenUserId(tokenA);
  const userB = tokenUserId(tokenB);
  check('both test users log in', Number.isInteger(userA) && Number.isInteger(userB));

  const sql = (statement, params) => withDb('MYDATABASEBITACORA', (q) => q(statement, params));
  const wipe = async () => {
    for (const table of ['entries', 'entries_trash', 'user_keys']) {
      await sql(`DELETE FROM ${table} WHERE user_id IN (?, ?)`, [userA, userB]);
    }
  };
  await wipe();
  onCleanup(async () => {
    await wipe();
    const [{ n }] = await sql(
      `SELECT (SELECT COUNT(*) FROM entries WHERE user_id IN (?, ?)) + (SELECT COUNT(*) FROM entries_trash WHERE user_id IN (?, ?))
            + (SELECT COUNT(*) FROM user_keys WHERE user_id IN (?, ?)) AS n`,
      [userA, userB, userA, userB, userA, userB]
    );
    check('orphan check: no rows or keys left for the test users', n === 0, { n });
  });
  const stateOf = async (userId) =>
    JSON.stringify(
      await sql(
        `SELECT 'e' AS t, DATE_FORMAT(entry_date, '%Y-%m-%d') AS d, version, body FROM entries WHERE user_id = ?
         UNION ALL SELECT 't', DATE_FORMAT(entry_date, '%Y-%m-%d'), version, body FROM entries_trash WHERE user_id = ?
         ORDER BY 1, 2`,
        [userId, userId]
      )
    );

  const diaryRoutes = [
    ['GET', `${B}/home/2016-01-01`],
    ['GET', `${B}/entries/2016-01-01/nearby`],
    ['GET', `${B}/entries/2016-01-01`],
    ['PUT', `${B}/entries/2016-01-01`, { body: 'x', baseVersion: null }],
    ['DELETE', `${B}/entries/2016-01-01`],
    ['GET', `${B}/entries?month=2016-01`],
    ['POST', `${B}/entries/import`, { entries: [{ date: '2016-01-01', body: 'x' }], onConflict: 'skip' }],
    ['GET', `${B}/trash`],
    ['POST', `${B}/trash/2016-01-01/restore`, {}],
    ['POST', `${B}/search`, { q: 'melgar' }],
  ];

  // ═══════════════════════════ K1 — the gate ═══════════════════════════
  section('K1 — CORS preflight allows the key header; no key → 428');
  const preflight = await fetch(`${BASE_URL}${B}/home/2016-01-01`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://bitacora.animecream.com',
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'authorization,x-bitacora-key',
    },
  });
  const allowed = (preflight.headers.get('access-control-allow-headers') || '').toLowerCase();
  check('preflight answers 2xx and allows x-bitacora-key (constraint 13)', preflight.status < 300 && allowed.includes('x-bitacora-key'), {
    status: preflight.status,
    allowed,
  });

  for (const [method, path, body] of diaryRoutes) {
    const r = await http(method, path, { token: tokenB, body });
    check(`${method} ${path} for an account with no key → 428 KEY_NOT_SET`, r.status === 428 && r.body?.message === 'KEY_NOT_SET', {
      status: r.status,
      message: r.body?.message,
    });
  }

  // ═══════════════════════════ K2 — creating the key ═══════════════════════════
  section('K2 — GET /key 404 → POST /key 201 → GET /key the same parameters → POST again 409');
  const before = await http('GET', `${B}/key`, { token: tokenA });
  check('GET /key before → 404 KEY_NOT_SET', before.status === 404 && before.body?.message === 'KEY_NOT_SET', { status: before.status });
  const salt = toBase64url(crypto.randomBytes(16));
  const keyA = deriveKey(E2E_PASSPHRASE, salt, 600000);
  keysSeen.push(keyA);
  const created = await http('POST', `${B}/key`, { token: tokenA, body: { iterations: 600000, salt }, headers: { 'x-bitacora-key': keyA } });
  check('POST /key → 201 with { kdf, iterations, salt }', created.status === 201 && created.body?.data?.salt === salt && created.body?.data?.kdf === 'PBKDF2-SHA256', {
    status: created.status,
  });
  const after = await http('GET', `${B}/key`, { token: tokenA });
  check('GET /key after → the same salt and rounds, and no wrapped key', after.status === 200 && after.body?.data?.salt === salt && after.body?.data?.iterations === 600000 && !JSON.stringify(after.body).includes('v1:'));
  const again = await http('POST', `${B}/key`, { token: tokenA, body: { iterations: 600000, salt }, headers: { 'x-bitacora-key': keyA } });
  check('POST /key again → 409', again.status === 409, { status: again.status });
  const badParams = await http('POST', `${B}/key`, { token: tokenB, body: { iterations: 1000, salt: 'short' }, headers: { 'x-bitacora-key': 'nope' } });
  check('POST /key with bad parameters and a malformed key → 400 with 3 errors', badParams.status === 400 && badParams.body?.errors?.length === 3, { status: badParams.status });
  // openDiary now finds A's key and derives the same header from the passphrase, like a second device.
  check('a second device derives the same key from the passphrase', (await openDiary(tokenA)) === keyA);
  keysSeen.push(await openDiary(tokenB));

  for (const [method, path, body] of diaryRoutes) {
    const r = await http(method, path, { token: tokenA, body, headers: NO_KEY });
    check(`${method} ${path} without the header → 428 KEY_REQUIRED`, r.status === 428 && r.body?.message === 'KEY_REQUIRED', { status: r.status });
  }
  const s1 = await http('GET', `${B}/trash`, { headers: { 'x-bitacora-key': keyA } });
  check('a key without a token → 401 (the token comes first)', s1.status === 401, { status: s1.status });

  // ═══════════════════════════ K3 — at rest ═══════════════════════════
  section('K3 — what is written is stored encrypted, and read back in clear');
  const put = await http('PUT', `${B}/entries/2016-01-01`, { token: tokenA, body: { body: text('K3'), baseVersion: null } });
  check('PUT → 201 with the text', put.status === 201 && put.body?.data?.body === text('K3'), { status: put.status });
  const [stored] = await sql("SELECT body FROM entries WHERE user_id = ? AND entry_date = '2016-01-01'", [userA]);
  check('the stored body starts with v1: and holds neither the marker nor the accented word', stored?.body?.startsWith('v1:') && !stored.body.includes(MARKER) && !stored.body.includes('Bogotá'));
  const got = await http('GET', `${B}/entries/2016-01-01`, { token: tokenA });
  check('GET → the same text', got.status === 200 && got.body?.data?.body === text('K3'));
  await http('PUT', `${B}/entries/2016-02-02`, { token: tokenA, body: { body: text('to trash'), baseVersion: null } });
  await http('DELETE', `${B}/entries/2016-02-02`, { token: tokenA });
  const [trashRow] = await sql("SELECT body FROM entries_trash WHERE user_id = ? AND entry_date = '2016-02-02'", [userA]);
  check('a deleted entry stays encrypted in the trash', trashRow?.body?.startsWith('v1:') && !trashRow.body.includes(MARKER));
  const trash = await http('GET', `${B}/trash`, { token: tokenA });
  check('GET /trash → a preview in clear', trash.status === 200 && trash.body?.data?.[0]?.preview?.startsWith(MARKER));
  const imported = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: [{ date: '2016-03-03', body: text('import') }], onConflict: 'skip' } });
  const [importRow] = await sql("SELECT body FROM entries WHERE user_id = ? AND entry_date = '2016-03-03'", [userA]);
  check('an imported entry is stored encrypted', imported.status === 200 && importRow?.body?.startsWith('v1:') && !importRow.body.includes(MARKER));
  const found = await http('POST', `${B}/search`, { token: tokenA, body: { q: 'bogota' } });
  check('search finds the encrypted days, accent-blind (Q3 over ciphertext)', found.status === 200 && found.body?.data?.total === 2, { total: found.body?.data?.total });

  // ═══════════════════════════ K4 — a wrong key changes nothing ═══════════════════════════
  section('K4 — a wrong key → 403 KEY_WRONG on every route, and the database does not change');
  const beforeWrong = await stateOf(userA);
  const wrong = randomKey();
  for (const [method, path, body] of diaryRoutes) {
    const r = await http(method, path, { token: tokenA, body, headers: { 'x-bitacora-key': wrong } });
    check(`${method} ${path} with a wrong key → 403 KEY_WRONG`, r.status === 403 && r.body?.message === 'KEY_WRONG', { status: r.status });
  }
  check('entries and trash are byte-for-byte the same after the wrong-key calls', (await stateOf(userA)) === beforeWrong);

  // ═══════════════════════════ K5 — a body moved by SQL ═══════════════════════════
  section('K5 — a body moved to another date by SQL does not decrypt → 500, no text');
  await http('PUT', `${B}/entries/2016-04-04`, { token: tokenA, body: { body: text('K5'), baseVersion: null } });
  await sql("UPDATE entries SET entry_date = '2016-04-05' WHERE user_id = ? AND entry_date = '2016-04-04'", [userA]);
  const moved = await http('GET', `${B}/entries/2016-04-05`, { token: tokenA });
  check('GET the moved day → 500 Internal server error, with no text', moved.status === 500 && moved.body?.message === 'Internal server error' && !JSON.stringify(moved.body).includes(MARKER), {
    status: moved.status,
  });
  await sql("DELETE FROM entries WHERE user_id = ? AND entry_date = '2016-04-05'", [userA]);

  // ═══════════════════════════ K6 — changing the passphrase ═══════════════════════════
  section('K6 — PUT /key re-wraps the key: the old key stops working, every entry still reads');
  const versionsBefore = await sql('SELECT entry_date, version, body FROM entries WHERE user_id = ? ORDER BY entry_date', [userA]);
  const newSalt = toBase64url(crypto.randomBytes(16));
  const newKey = deriveKey(NEW_PASSPHRASE, newSalt, 650000);
  keysSeen.push(newKey);
  const wrongCurrent = await http('PUT', `${B}/key`, {
    token: tokenA,
    body: { iterations: 650000, salt: newSalt },
    headers: { 'x-bitacora-key': randomKey(), 'x-bitacora-new-key': newKey },
  });
  check('PUT /key with a wrong current key → 403', wrongCurrent.status === 403, { status: wrongCurrent.status });
  const changed = await http('PUT', `${B}/key`, {
    token: tokenA,
    body: { iterations: 650000, salt: newSalt },
    headers: { 'x-bitacora-new-key': newKey },
  });
  check('PUT /key → 200 with the new parameters', changed.status === 200 && changed.body?.data?.salt === newSalt && changed.body?.data?.iterations === 650000, {
    status: changed.status,
  });
  const oldKey = await http('GET', `${B}/entries/2016-01-01`, { token: tokenA });
  check('the old key now → 403 KEY_WRONG', oldKey.status === 403, { status: oldKey.status });
  const fresh = await openDiary(tokenA, NEW_PASSPHRASE);
  check('the new passphrase derives the new key from the stored parameters', fresh === newKey);
  const reread = await http('GET', `${B}/entries/2016-01-01`, { token: tokenA });
  check('the new key reads the entry written under the old one', reread.status === 200 && reread.body?.data?.body === text('K3'));
  const versionsAfter = await sql('SELECT entry_date, version, body FROM entries WHERE user_id = ? ORDER BY entry_date', [userA]);
  check('no body and no version changed: only the key was re-wrapped', JSON.stringify(versionsAfter) === JSON.stringify(versionsBefore));

  // ═══════════════════════════ K7 — isolation ═══════════════════════════
  section("K7 — user B, with B's own key, on A's dates sees only B's own view");
  const bGet = await http('GET', `${B}/entries/2016-01-01`, { token: tokenB });
  check("B's GET of A's date → 404", bGet.status === 404, { status: bGet.status });
  const bSearch = await http('POST', `${B}/search`, { token: tokenB, body: { q: 'bogota' } });
  check("B's search finds none of A's days", bSearch.status === 200 && bSearch.body?.data?.total === 0);
  const aWithB = await http('GET', `${B}/entries/2016-01-01`, { token: tokenA, headers: { 'x-bitacora-key': keysSeen[1] } });
  check("A's token with B's key → 403 (a key opens only its own account)", aWithB.status === 403, { status: aWithB.status });

  // ═══════════════════════════ K9 — nothing secret in the output ═══════════════════════════
  section('K9 — the output (and the server log) hold no text, passphrase or key');
  const secrets = [MARKER, E2E_PASSPHRASE, NEW_PASSPHRASE, ...keysSeen];
  const printed = output.join('\n');
  check('this run printed no text, passphrase or key', !secrets.some((s) => printed.includes(s)));
  if (process.env.E2E_SERVER_LOG) {
    const log = fs.readFileSync(process.env.E2E_SERVER_LOG, 'utf8');
    check('the server log holds no text, passphrase or key', !secrets.some((s) => log.includes(s)));
  } else {
    console.log('  (E2E_SERVER_LOG not set: server log not checked)');
  }
});
