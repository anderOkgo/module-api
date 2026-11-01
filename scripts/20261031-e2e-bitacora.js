/* eslint-disable */
/**
 * E2E — Bitácora API contract (module-docs/apps/bitacora/SPEC.md v1.0.1, §6 rows with layer API)
 * Doc: docs/changes/20261031-bitacora-day0.md
 *
 * Requires:
 *   - the API on E2E_BASE_URL (default http://localhost:3001), built from this branch;
 *   - the two LOCAL test users of playbook annex D.1 in .env.e2e.local (gitignored):
 *     E2E_USER_A / E2E_PASSWORD_A and E2E_USER_B / E2E_PASSWORD_B (B has uppercase letters, S3);
 *   - MYHOST / MYPORT / MYUSER / MYPASSWORD / MYDATABASEBITACORA (from .env) for the SQL checks
 *     and the T5 fixture (an old trash row) — local database only;
 *   - optional E2E_SERVER_LOG: path of the server's captured output, grepped for entry text (N2).
 * Usage: node scripts/20261031-e2e-bitacora.js
 *
 * Data: only the two test users' rows are touched. Every run starts and ends by deleting their
 * entries and trash rows, and ends with an orphan check. Never run against the owner's account.
 * Privacy (N2, S5): entry text is never printed; every fixture text carries a random marker and
 * the run's own output (and the server log, if given) is checked for it at the end.
 * Expected 4xx on purpose: A3/A4/T3 (409), A5/A6/A8/M2/L1/L2 (400), A9/T5/S2 (404), S1 (401).
 * Negative controls (§6.9): A3, S2 and S4 must FAIL against a build with that protection removed.
 */
const fs = require('fs');
const { check, section, http, login, tokenUserId, withDb, onCleanup, run } = require('./_e2e-helpers');

// ── S5: keep everything this run prints, to grep it for entry text at the end ──
const output = [];
for (const level of ['log', 'error']) {
  const original = console[level];
  console[level] = (...args) => {
    output.push(args.join(' '));
    original(...args);
  };
}

const MARKER = `e2e-private-${Math.random().toString(36).slice(2, 10)}`;
const text = (label) => `${MARKER} ${label} — a private line of the journal.`;
const DAY_MS = 86400000;
const utcDate = (offsetDays) => new Date(Date.now() + offsetDays * DAY_MS).toISOString().slice(0, 10);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const B = '/api/bitacora';

run(async () => {
  section('0. Setup — log in both test users, start from an empty journal');
  const tokenA = await login(process.env.E2E_USER_A, process.env.E2E_PASSWORD_A);
  const tokenB = await login(process.env.E2E_USER_B, process.env.E2E_PASSWORD_B);
  const userA = tokenUserId(tokenA);
  const userB = tokenUserId(tokenB);
  check('both test users log in and their tokens carry a numeric userId', Number.isInteger(userA) && Number.isInteger(userB));
  check('user B has uppercase letters in its username (S3 setup)', /[A-Z]/.test(process.env.E2E_USER_B));

  const wipe = () =>
    withDb('MYDATABASEBITACORA', async (q) => {
      await q('DELETE FROM entries WHERE user_id IN (?, ?)', [userA, userB]);
      await q('DELETE FROM entries_trash WHERE user_id IN (?, ?)', [userA, userB]);
    });
  await wipe();
  onCleanup(async () => {
    await wipe();
    const [{ n }] = await withDb('MYDATABASEBITACORA', (q) =>
      q(
        `SELECT (SELECT COUNT(*) FROM entries WHERE user_id IN (?, ?)) +
                (SELECT COUNT(*) FROM entries_trash WHERE user_id IN (?, ?)) AS n`,
        [userA, userB, userA, userB]
      )
    );
    check('orphan check: no rows left for the test users', n === 0, { n });
  });

  const put = (date, body, baseVersion, token = tokenA) => http('PUT', `${B}/entries/${date}`, { token, body: { body, baseVersion } });
  const get = (date, token = tokenA) => http('GET', `${B}/entries/${date}`, { token });

  // ═══════════════════════════ 6.1 Writing and reading a day ═══════════════════════════
  section('A1 — PUT a new date with baseVersion null → 201, version 1, body trimmed');
  const a1 = await put('2015-05-10', `   ${text('A1')}  \n`, null);
  check('201 Created', a1.status === 201, a1);
  check('version is 1', a1.body?.data?.version === 1, a1.body);
  check('body is trimmed', a1.body?.data?.body === text('A1'), a1.body);
  check('envelope { success: true, message, data }', a1.body?.success === true && typeof a1.body?.message === 'string');

  section('A2 — PUT the same date with the current version → 200, version +1, modified updated');
  await sleep(1100); // `modified` has one-second resolution
  const a2 = await put('2015-05-10', text('A2'), 1);
  check('200 OK', a2.status === 200, a2);
  check('version is 2', a2.body?.data?.version === 2, a2.body);
  check('modified moved forward', a2.body?.data?.modified > a1.body?.data?.modified, {
    before: a1.body?.data?.modified,
    after: a2.body?.data?.modified,
  });

  section('A3 — PUT with an old baseVersion → 409 with the stored entry, nothing written');
  const a3 = await put('2015-05-10', text('A3 stale'), 1);
  check('409 Conflict', a3.status === 409, a3);
  check('409 carries the stored entry (version 2)', a3.body?.data?.version === 2 && a3.body?.data?.body === text('A2'), a3.body);
  const a3After = await get('2015-05-10');
  check('re-GET still shows the newer text', a3After.body?.data?.body === text('A2') && a3After.body?.data?.version === 2, a3After.body);

  section('A4 — PUT with baseVersion null when an entry exists → 409, nothing written');
  const a4 = await put('2015-05-10', text('A4'), null);
  check('409 Conflict', a4.status === 409, a4);
  check('stored entry unchanged', (await get('2015-05-10')).body?.data?.version === 2);

  section('A5 — PUT an empty or whitespace-only body → 400, no row created');
  const a5Empty = await put('2015-05-13', '', null);
  const a5Blank = await put('2015-05-13', ' \n\t ', null);
  check('empty → 400', a5Empty.status === 400, a5Empty);
  check('whitespace-only → 400', a5Blank.status === 400, a5Blank);
  check('400 envelope lists errors', Array.isArray(a5Blank.body?.errors) && a5Blank.body?.success === false, a5Blank.body);
  check('no row created (GET → 404)', (await get('2015-05-13')).status === 404);

  section('A6 — PUT 100,000 chars → 201; 100,001 chars → 400');
  const longText = (n) => (MARKER + ' ' + 'x'.repeat(n)).slice(0, n);
  const a6Ok = await put('2015-05-12', longText(100000), null);
  check('100,000 chars → 201', a6Ok.status === 201, { status: a6Ok.status, message: a6Ok.body?.message });
  check('read back with the same length', (await get('2015-05-12')).body?.data?.body?.length === 100000);
  const a6Long = await put('2015-05-14', longText(100001), null);
  check('100,001 chars → 400', a6Long.status === 400, { status: a6Long.status, errors: a6Long.body?.errors });
  check('nothing written for the long one', (await get('2015-05-14')).status === 404);

  section('A7 — accents and emoji are read back byte-identical');
  const a7Text = `${text('A7')} ñ á é ü Ñ 😀 🌙 — “quotes”`;
  const a7 = await put('2015-05-11', a7Text, null);
  check('201 Created', a7.status === 201, a7);
  const a7Back = await get('2015-05-11');
  check('identical string through the API', a7Back.body?.data?.body === a7Text, { length: a7Back.body?.data?.body?.length });
  const [a7Row] = await withDb('MYDATABASEBITACORA', (q) =>
    q('SELECT HEX(body) AS hex FROM entries WHERE user_id = ? AND entry_date = ?', [userA, '2015-05-11'])
  );
  check('identical bytes in the database (utf8mb4)', a7Row?.hex === Buffer.from(a7Text, 'utf8').toString('hex').toUpperCase());

  section('A8 — invalid dates → 400');
  for (const date of ['2026-02-30', '2026-13-01', 'abc', '1899-12-31', utcDate(2)]) {
    const r = await get(date);
    check(`GET /entries/${date} → 400`, r.status === 400, r);
  }
  const tomorrow = await get(utcDate(1));
  check(`server UTC date + 1 (${utcDate(1)}) is accepted (404, not 400)`, tomorrow.status === 404, tomorrow);

  section('A9 — GET a date with no entry → 404');
  const a9 = await get('2015-06-01');
  check('404', a9.status === 404, a9);
  check('404 envelope', a9.body?.success === false && typeof a9.body?.message === 'string', a9.body);

  // ═══════════════════════════ 6.3 Home — on this day ═══════════════════════════
  section('H1 — GET /home/2026-03-04 with entries on Mar 4 of 2019, 2021, 2026');
  for (const date of ['2019-03-04', '2021-03-04', '2026-03-04']) await put(date, text(`H1 ${date}`), null);
  const h1 = await http('GET', `${B}/home/2026-03-04`, { token: tokenA });
  check('200', h1.status === 200, h1);
  check("entry is 2026's", h1.body?.data?.entry?.date === '2026-03-04');
  const otd = h1.body?.data?.onThisDay || [];
  check(
    'onThisDay = 2021 then 2019, yearsAgo 5 and 7',
    otd.length === 2 && otd[0].date === '2021-03-04' && otd[0].yearsAgo === 5 && otd[1].date === '2019-03-04' && otd[1].yearsAgo === 7,
    otd.map((e) => ({ date: e.date, yearsAgo: e.yearsAgo }))
  );
  check('onThisDay carries the full text', otd[0]?.body === text('H1 2021-03-04'));

  section('H2 — previousDay.written matches whether Mar 3 has an entry');
  check('Mar 3 empty → written false', h1.body?.data?.previousDay?.date === '2026-03-03' && h1.body?.data?.previousDay?.written === false, h1.body?.data?.previousDay);
  await put('2026-03-03', text('H2'), null);
  const h2 = await http('GET', `${B}/home/2026-03-04`, { token: tokenA });
  check('Mar 3 written → written true', h2.body?.data?.previousDay?.written === true, h2.body?.data?.previousDay);

  section('H3 — Feb 28 of a non-leap year includes Feb 29 of a leap year (D5)');
  await put('2024-02-29', text('H3'), null);
  const h3 = await http('GET', `${B}/home/2026-02-28`, { token: tokenA });
  const h3Dates = (h3.body?.data?.onThisDay || []).map((e) => `${e.date}/${e.yearsAgo}`);
  check('2024-02-29 is in onThisDay with yearsAgo 2', h3Dates.includes('2024-02-29/2'), h3Dates);

  section('H4 — /entries/2026-01-02/nearby crosses the year end');
  const h4Fixtures = ['2019-12-30', '2025-01-05', '2024-01-02', '2025-12-31', '2020-01-06'];
  for (const date of h4Fixtures) await put(date, text(`H4 ${date}`), null);
  const h4 = await http('GET', `${B}/entries/2026-01-02/nearby`, { token: tokenA });
  const h4Got = (h4.body?.data || []).map((e) => `${e.date}/${e.yearsAgo}/${e.offsetDays}`);
  check('200', h4.status === 200, h4);
  check(
    'exactly 2025-01-05 (1 y, +3) and 2019-12-30 (6 y, −3), by year then offset',
    JSON.stringify(h4Got) === JSON.stringify(['2025-01-05/1/3', '2019-12-30/6/-3']),
    h4Got
  );
  check('excludes the exact match 2024-01-02', !h4Got.some((s) => s.startsWith('2024-01-02')));
  check('excludes 2025-12-31 (same year as the request) and 2020-01-06 (outside ±3)', !h4Got.some((s) => /^2025-12-31|^2020-01-06/.test(s)));

  // ═══════════════════════════ 6.4 Month ═══════════════════════════
  section("M1 — GET /entries?month=2026-02 → only that month's dates, ascending, no text");
  for (const date of ['2026-02-14', '2026-02-01', '2026-01-31', '2026-03-01']) await put(date, text(`M1 ${date}`), null);
  const m1 = await http('GET', `${B}/entries?month=2026-02`, { token: tokenA });
  check('200', m1.status === 200, m1);
  check(
    'dates = 2026-02-01, 2026-02-14 (Feb 29 of 2024 is another month)',
    JSON.stringify(m1.body?.data) === JSON.stringify({ month: '2026-02', dates: ['2026-02-01', '2026-02-14'] }),
    m1.body?.data
  );

  section('M2 — month=2026-13 and month=abc → 400');
  for (const month of ['2026-13', 'abc']) {
    const r = await http('GET', `${B}/entries?month=${month}`, { token: tokenA });
    check(`month=${month} → 400`, r.status === 400, r);
  }

  // ═══════════════════════════ 6.5 Delete and trash ═══════════════════════════
  section('T1 — DELETE → 200 with purgeOn = now + 30 days; GET → 404; listed in the trash');
  await put('2016-07-01', text('T1'), null);
  const t1 = await http('DELETE', `${B}/entries/2016-07-01`, { token: tokenA });
  check('200', t1.status === 200, t1);
  const purgeDelta = Date.parse(t1.body?.data?.purgeOn) - (Date.now() + 30 * DAY_MS);
  check('purgeOn is 30 days from now (±2 min)', Math.abs(purgeDelta) < 120000, t1.body?.data);
  check('GET that date → 404', (await get('2016-07-01')).status === 404);
  const t1Trash = await http('GET', `${B}/trash`, { token: tokenA });
  const t1Item = (t1Trash.body?.data || []).find((i) => i.date === '2016-07-01');
  check('listed in GET /trash with preview, deletedAt and purgeOn', !!t1Item && !!t1Item.preview && !!t1Item.deletedAt && t1Item.purgeOn === t1.body?.data?.purgeOn, t1Item);
  check('DELETE of a date with no entry → 404', (await http('DELETE', `${B}/entries/2016-07-09`, { token: tokenA })).status === 404);

  section('T2 — restore → entry back with its text, gone from the trash');
  const t2 = await http('POST', `${B}/trash/2016-07-01/restore`, { token: tokenA, body: {} });
  check('200', t2.status === 200, t2);
  check('text restored', t2.body?.data?.body === text('T1'), t2.body);
  const t2Trash = await http('GET', `${B}/trash`, { token: tokenA });
  check('no longer in the trash', !(t2Trash.body?.data || []).some((i) => i.date === '2016-07-01'));

  section('T3 — delete, write a new entry, restore with "fail" → 409 with the current entry, nothing changed');
  await put('2016-07-02', text('T3 old'), null);
  await http('DELETE', `${B}/entries/2016-07-02`, { token: tokenA });
  await put('2016-07-02', text('T3 new'), null);
  const t3 = await http('POST', `${B}/trash/2016-07-02/restore`, { token: tokenA, body: { onConflict: 'fail' } });
  check('409', t3.status === 409, t3);
  check('409 carries the current entry', t3.body?.data?.body === text('T3 new'), t3.body);
  check('current entry unchanged', (await get('2016-07-02')).body?.data?.body === text('T3 new'));
  check('deleted one still in the trash', ((await http('GET', `${B}/trash`, { token: tokenA })).body?.data || []).some((i) => i.date === '2016-07-02'));

  section('T4 — same with "keepBoth" / "replace"');
  const t4KeepBoth = await http('POST', `${B}/trash/2016-07-02/restore`, { token: tokenA, body: { onConflict: 'keepBoth' } });
  check('keepBoth → 200', t4KeepBoth.status === 200, t4KeepBoth);
  check('keepBoth: current text, blank line, deleted text', t4KeepBoth.body?.data?.body === `${text('T3 new')}\n\n${text('T3 old')}`, t4KeepBoth.body);
  await put('2016-07-03', text('T4 old'), null);
  await http('DELETE', `${B}/entries/2016-07-03`, { token: tokenA });
  const t4New = await put('2016-07-03', text('T4 new'), null);
  const t4Replace = await http('POST', `${B}/trash/2016-07-03/restore`, { token: tokenA, body: { onConflict: 'replace' } });
  check('replace → 200', t4Replace.status === 200, t4Replace);
  check('replace: the deleted text, version moved forward', t4Replace.body?.data?.body === text('T4 old') && t4Replace.body?.data?.version > t4New.body?.data?.version, t4Replace.body);

  section('T5 — a trash row older than 30 days: not listed, restore → 404, purged by the next call');
  await withDb('MYDATABASEBITACORA', (q) =>
    q(
      `INSERT INTO entries_trash (user_id, entry_date, body, version, created, modified, deleted_at)
       VALUES (?, '2016-08-01', ?, 1, UTC_TIMESTAMP(), UTC_TIMESTAMP(), UTC_TIMESTAMP() - INTERVAL 31 DAY)`,
      [userA, text('T5')]
    )
  );
  const t5Count = () =>
    withDb('MYDATABASEBITACORA', (q) => q("SELECT COUNT(*) AS n FROM entries_trash WHERE user_id = ? AND entry_date = '2016-08-01'", [userA]));
  check('fixture inserted', (await t5Count())[0].n === 1);
  const t5Restore = await http('POST', `${B}/trash/2016-08-01/restore`, { token: tokenA, body: {} });
  check('restore → 404', t5Restore.status === 404, t5Restore);
  check('purged by that call', (await t5Count())[0].n === 0);
  const t5Trash = await http('GET', `${B}/trash`, { token: tokenA });
  check('not listed', !(t5Trash.body?.data || []).some((i) => i.date === '2016-08-01'));

  // ═══════════════════════════ 6.6 Isolation, auth and security ═══════════════════════════
  section('S1 — every endpoint without a token / with an invalid token → 401');
  const routes = [
    ['GET', `${B}/home/2015-05-10`],
    ['GET', `${B}/entries/2015-05-10/nearby`],
    ['GET', `${B}/entries/2015-05-10`],
    ['PUT', `${B}/entries/2015-05-10`],
    ['DELETE', `${B}/entries/2015-05-10`],
    ['GET', `${B}/entries?month=2015-05`],
    ['POST', `${B}/entries/import`],
    ['GET', `${B}/trash`],
    ['POST', `${B}/trash/2015-05-10/restore`],
  ];
  for (const [method, path] of routes) {
    const body = method === 'GET' || method === 'DELETE' ? undefined : {};
    const none = await http(method, path, { body });
    const bad = await http(method, path, { body, token: 'not.a.token' });
    check(`${method} ${path.replace(B, '')}: no token ${none.status}, bad token ${bad.status}`, none.status === 401 && bad.status === 401);
  }
  check('A\'s entry untouched by the 401 calls', (await get('2015-05-10')).body?.data?.version === 2);

  section("S2 — user B never sees, overwrites, deletes or restores A's data");
  await put('2016-07-04', text('S2 A trashed'), null);
  await http('DELETE', `${B}/entries/2016-07-04`, { token: tokenA });
  const bGet = await get('2015-05-10', tokenB);
  check("B GET A's date → 404", bGet.status === 404, bGet);
  const bHome = await http('GET', `${B}/home/2026-03-04`, { token: tokenB });
  check("B home → no entry, no onThisDay, previous day not written", bHome.body?.data?.entry === null && (bHome.body?.data?.onThisDay || []).length === 0 && bHome.body?.data?.previousDay?.written === false, bHome.body?.data);
  const bNearby = await http('GET', `${B}/entries/2026-01-02/nearby`, { token: tokenB });
  check('B nearby → empty', Array.isArray(bNearby.body?.data) && bNearby.body.data.length === 0, bNearby.body);
  const bMonth = await http('GET', `${B}/entries?month=2026-02`, { token: tokenB });
  check('B month → no dates', JSON.stringify(bMonth.body?.data?.dates) === '[]', bMonth.body);
  const bTrash = await http('GET', `${B}/trash`, { token: tokenB });
  check("B trash → empty (A's deletions not visible)", Array.isArray(bTrash.body?.data) && bTrash.body.data.length === 0, bTrash.body);
  check("B DELETE A's date → 404", (await http('DELETE', `${B}/entries/2015-05-10`, { token: tokenB })).status === 404);
  check("B restore A's deleted date → 404", (await http('POST', `${B}/trash/2016-07-04/restore`, { token: tokenB, body: {} })).status === 404);
  const bPut = await put('2015-05-10', text('S2 B own'), null, tokenB);
  check("B PUT on A's date with baseVersion null → 201 (B's own entry, no 409)", bPut.status === 201 && bPut.body?.data?.version === 1, bPut);
  const bSpoof = await http('PUT', `${B}/entries/2015-05-15`, { token: tokenB, body: { userId: userA, body: text('S2 spoof'), baseVersion: null } });
  check('a userId in the body is ignored (written as B)', bSpoof.status === 201 && (await get('2015-05-15')).status === 404, { status: bSpoof.status });
  const aAfter = await get('2015-05-10');
  check("A's entry unchanged (text and version)", aAfter.body?.data?.body === text('A2') && aAfter.body?.data?.version === 2, aAfter.body);
  const owners = await withDb('MYDATABASEBITACORA', (q) =>
    q("SELECT user_id, version FROM entries WHERE entry_date = '2015-05-10' AND user_id IN (?, ?) ORDER BY user_id", [userA, userB])
  );
  check('two separate rows in the database, one per user', owners.length === 2 && owners.every((r) => [userA, userB].includes(r.user_id)), owners);

  section('S3 — a username with uppercase letters works the same (data keyed by userId)');
  const bRead = await get('2015-05-10', tokenB);
  check("B reads its own entry back", bRead.status === 200 && bRead.body?.data?.body === text('S2 B own'), bRead);
  const bUpdate = await put('2015-05-10', text('S3 B update'), 1, tokenB);
  check('B updates it with its version → 200, version 2', bUpdate.status === 200 && bUpdate.body?.data?.version === 2, bUpdate);
  const [bRow] = await withDb('MYDATABASEBITACORA', (q) =>
    q("SELECT user_id FROM entries WHERE entry_date = '2015-05-10' AND version = 2 AND user_id = ?", [userB])
  );
  check('stored under B\'s numeric user_id', bRow?.user_id === userB, bRow);

  section('S4 — route ordering: import, month and nearby never reach /entries/:date');
  const s4Month = await http('GET', `${B}/entries?month=2015-05`, { token: tokenA });
  check('GET /entries?month= → month handler', s4Month.status === 200 && s4Month.body?.data?.month === '2015-05' && Array.isArray(s4Month.body?.data?.dates), s4Month);
  const s4Import = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: [{ date: '2017-01-01', body: text('S4') }], onConflict: 'skip' } });
  check('POST /entries/import → import handler', s4Import.status === 200 && Array.isArray(s4Import.body?.data?.created), s4Import);
  const s4Nearby = await http('GET', `${B}/entries/2026-01-02/nearby`, { token: tokenA });
  check('GET /entries/:date/nearby → nearby handler (array, not an Entry)', s4Nearby.status === 200 && Array.isArray(s4Nearby.body?.data), s4Nearby);

  // ═══════════════════════════ 6.7 History load ═══════════════════════════
  const countA = async () => (await withDb('MYDATABASEBITACORA', (q) => q('SELECT COUNT(*) AS n FROM entries WHERE user_id = ?', [userA])))[0].n;

  section('L1 — import 1,001 items → 400, nothing written');
  const before = await countA();
  const items = (n, startYear) =>
    Array.from({ length: n }, (_, i) => ({ date: new Date(Date.UTC(startYear, 0, 1) + i * DAY_MS).toISOString().slice(0, 10), body: text(`L ${i}`) }));
  const l1 = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: items(1001, 1990), onConflict: 'skip' } });
  check('400', l1.status === 400, { status: l1.status, errors: l1.body?.errors });
  check('nothing written', (await countA()) === before);

  section('L2 — one invalid item among valid ones → 400, nothing written');
  const l2Items = items(5, 1995);
  l2Items[3] = { date: '1995-02-30', body: text('L2 bad') };
  const l2 = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: l2Items, onConflict: 'skip' } });
  check('400 naming the bad item', l2.status === 400 && (l2.body?.errors || []).some((e) => e.startsWith('entries[3]')), l2.body);
  check('nothing written', (await countA()) === before);

  section('L3 — import the same items twice with "skip": all created, then all skipped, texts unchanged');
  const l3Items = items(1000, 2000);
  const l3First = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: l3Items, onConflict: 'skip' } });
  check('first run: 1,000 created', l3First.status === 200 && l3First.body?.data?.created?.length === 1000 && l3First.body?.data?.skipped?.length === 0, { status: l3First.status, sizes: l3First.body?.data && Object.fromEntries(Object.entries(l3First.body.data).map(([k, v]) => [k, v.length])) });
  const changed = l3Items.map((i) => ({ ...i, body: text('L3 changed') }));
  const l3Second = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: changed, onConflict: 'skip' } });
  check('second run: 1,000 skipped, 0 created', l3Second.status === 200 && l3Second.body?.data?.skipped?.length === 1000 && l3Second.body?.data?.created?.length === 0, { status: l3Second.status });
  const sample = await get(l3Items[500].date);
  check('texts unchanged (spot-check)', sample.body?.data?.body === l3Items[500].body && sample.body?.data?.version === 1, { date: l3Items[500].date });
  const l3Over = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: changed.slice(0, 2), onConflict: 'overwrite' } });
  check('"overwrite" replaces and bumps the version', l3Over.body?.data?.overwritten?.length === 2 && (await get(l3Items[0].date)).body?.data?.version === 2, l3Over.body?.data);

  // ═══════════════════════════ S5 — no entry text in any output ═══════════════════════════
  section('S5 — E2E output (and server log, if given) contain no entry text');
  check('this run printed no fixture text', !output.join('\n').includes(MARKER));
  if (process.env.E2E_SERVER_LOG) {
    const log = fs.readFileSync(process.env.E2E_SERVER_LOG, 'utf8');
    check(`server log has no fixture text (${log.length} bytes checked)`, !log.includes(MARKER));
  } else {
    console.log('  ⚠️  E2E_SERVER_LOG not set — server log not checked');
  }
});
