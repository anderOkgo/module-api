/* eslint-disable */
/**
 * E2E — Bitácora search, C14 `POST /api/bitacora/search`
 * (module-docs/apps/bitacora/SPEC.md v1.10, §6.11 rows with layer API: Q1–Q7, plus S1 and S5 for the new route)
 * Doc: docs/changes/20261108-bitacora-search.md
 *
 * Requires:
 *   - the API on E2E_BASE_URL (default http://localhost:3001), built from this branch;
 *   - the two LOCAL test users of playbook annex D.1 in .env.e2e.local (gitignored):
 *     E2E_USER_A / E2E_PASSWORD_A and E2E_USER_B / E2E_PASSWORD_B;
 *   - MYHOST / MYPORT / MYUSER / MYPASSWORD / MYDATABASEBITACORA (from .env) — local database only;
 *   - optional E2E_SERVER_LOG: path of the server's captured output, grepped for query and entry text (N2).
 * Usage: node scripts/20261108-e2e-bitacora-search.js
 *
 * Data: only the two test users' rows are touched. The run starts and ends by deleting their entries
 * and trash rows, and ends with an orphan check. Never run against the owner's account.
 * Privacy (N2, S5): no body, query or snippet is printed. Every fixture and query word carries a random
 * tag, and this run's output (and the server log, if given) is checked for it at the end.
 * Expected 4xx on purpose: Q5 (400), S1 (401), the GET control (404).
 */
const fs = require('fs');
const { check, section, http, login, tokenUserId, withDb, onCleanup, run, openDiary } = require('./_e2e-helpers');

// ── S5: keep everything this run prints, to grep it at the end ──
const output = [];
for (const level of ['log', 'error']) {
  const original = console[level];
  console[level] = (...args) => {
    output.push(args.join(' '));
    original(...args);
  };
}

const TAG = Math.random().toString(36).slice(2, 8);
const W = (word) => `${word}${TAG}`; // a word no other row can hold
const MELGAR = W('melgar');
const BEACH = W('beach');
const TOWN = W('town');
const PAGED = W('paged');
const DAY_MS = 86400000;
const B = '/api/bitacora';

/** What may be printed about a response: status, counts and dates — never snippets. */
const summary = (r) => ({
  status: r.status,
  total: r.body?.data?.total,
  offset: r.body?.data?.offset,
  dates: r.body?.data?.results?.map((x) => x.date),
  errors: r.body?.errors,
});

run(async () => {
  section('0. Setup — log in both test users, start from an empty journal, write the fixtures');
  const tokenA = await login(process.env.E2E_USER_A, process.env.E2E_PASSWORD_A);
  const tokenB = await login(process.env.E2E_USER_B, process.env.E2E_PASSWORD_B);
  const userA = tokenUserId(tokenA);
  const userB = tokenUserId(tokenB);
  check('both test users log in and their tokens carry a numeric userId', Number.isInteger(userA) && Number.isInteger(userB));

  const wipe = () =>
    withDb('MYDATABASEBITACORA', async (q) => {
      await q('DELETE FROM entries WHERE user_id IN (?, ?)', [userA, userB]);
      await q('DELETE FROM entries_trash WHERE user_id IN (?, ?)', [userA, userB]);
      await q('DELETE FROM user_keys WHERE user_id IN (?, ?)', [userA, userB]);
    });
  await wipe();
  // v1.11 (D32): the search runs over encrypted bodies, matched in the API.
  await openDiary(tokenA);
  await openDiary(tokenB);
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

  const lead = 'It was a slow morning and nothing happened for hours. '.repeat(8);
  const fixtures = [
    // Q1: both words (twice, in either order), one word only, neither
    { date: '2012-03-03', body: `${lead}Then I left for ${MELGAR} with my brother and the ${BEACH} was empty.${' We ate fish by the road.'.repeat(10)}` },
    { date: '2011-07-01', body: `${BEACH} first, ${MELGAR} later.` },
    { date: '2012-01-01', body: `Only ${MELGAR} today.` },
    { date: '2011-01-01', body: `Only the ${BEACH} today.` },
    { date: '2010-01-01', body: 'Nothing to find here.' },
    // Q2: the phrase, and the same words in another order
    { date: '2009-05-05', body: `In the end I left for ${TOWN} at noon.` },
    { date: '2009-05-06', body: `For ${TOWN} I never left.` },
    // Q3: accent and case
    { date: '2008-01-01', body: `Back from Bogotá${TAG} on the night bus.` },
    // Q4: LIKE wildcards and the escape character
    { date: '2007-01-01', body: `Battery at 100%${TAG} again.` },
    { date: '2007-01-02', body: `Walked 1000${TAG} steps.` },
    { date: '2007-01-03', body: `The file a_b${TAG} was lost.` },
    { date: '2007-01-04', body: `The file axb${TAG} was found.` },
    { date: '2007-01-05', body: `A back\\slash${TAG} in a path.` },
    { date: '2007-01-06', body: `A backslash${TAG} without the sign.` },
  ];
  // Q6: 61 days holding the same word
  const paged = Array.from({ length: 61 }, (_, i) => ({
    date: new Date(Date.UTC(2000, 0, 1) + i * DAY_MS).toISOString().slice(0, 10),
    body: `Day ${i} of the ${PAGED} series.`,
  }));
  const loadA = await http('POST', `${B}/entries/import`, { token: tokenA, body: { entries: [...fixtures, ...paged], onConflict: 'skip' } });
  check('user A fixtures loaded (75 days)', loadA.status === 200 && loadA.body?.data?.created?.length === 75, { status: loadA.status });
  const loadB = await http('PUT', `${B}/entries/2012-03-03`, { token: tokenB, body: { body: `B also went to ${MELGAR}.`, baseVersion: null } });
  check('user B fixture written', loadB.status === 201, { status: loadB.status });

  const search = (body, token = tokenA) => http('POST', `${B}/search`, { token, body });
  const datesOf = (r) => r.body?.data?.results?.map((x) => x.date) ?? [];

  // ═══════════════════════════ 6.11 Search ═══════════════════════════
  section('Q1 — two words: only the days with both, newest first, total right, snippets ≤ 200 chars with a match');
  const q1 = await search({ q: `${MELGAR} ${BEACH}` });
  check('200 with the D3 envelope', q1.status === 200 && q1.body?.success === true && typeof q1.body?.message === 'string', summary(q1));
  check('only the two days with both words, newest first', JSON.stringify(datesOf(q1)) === JSON.stringify(['2012-03-03', '2011-07-01']), summary(q1));
  check('total 2, offset 0', q1.body?.data?.total === 2 && q1.body?.data?.offset === 0, summary(q1));
  const snippets = q1.body?.data?.results?.map((x) => x.snippet) ?? [];
  check('every snippet holds the first term', snippets.every((s) => s.toLowerCase().includes(MELGAR)), { lengths: snippets.map((s) => [...s].length) });
  const long = snippets[0] ?? '';
  check('the long day is cut: … at both ends, 200 chars of body', long.startsWith('…') && long.endsWith('…') && [...long].length === 202, { length: [...long].length });
  check('the short day is whole', snippets[1] === fixtures[1].body, { length: snippets[1]?.length });

  section('Q2 — a quoted phrase matches only that phrase');
  const q2 = await search({ q: `"left for ${TOWN}"` });
  check('only the day with the phrase', q2.status === 200 && JSON.stringify(datesOf(q2)) === '["2009-05-05"]' && q2.body?.data?.total === 1, summary(q2));
  const q2Words = await search({ q: `left for ${TOWN}` });
  check('the same words without quotes find both days', q2Words.body?.data?.total === 2, summary(q2Words));

  section('Q3 — case- and accent-blind');
  const q3Upper = await search({ q: MELGAR.toUpperCase() });
  check('upper case finds the 3 days with the word', q3Upper.body?.data?.total === 3, summary(q3Upper));
  const q3Accent = await search({ q: `bogota${TAG}` });
  check('"bogota" finds "Bogotá"', JSON.stringify(datesOf(q3Accent)) === '["2008-01-01"]', summary(q3Accent));

  section('Q4 — %, _ and \\ are literal');
  const q4Percent = await search({ q: `100%${TAG}` });
  check('"100%" finds only "100%", not "1000"', JSON.stringify(datesOf(q4Percent)) === '["2007-01-01"]', summary(q4Percent));
  const q4Underscore = await search({ q: `a_b${TAG}` });
  check('"a_b" finds only "a_b", not "axb"', JSON.stringify(datesOf(q4Underscore)) === '["2007-01-03"]', summary(q4Underscore));
  const q4Backslash = await search({ q: `back\\slash${TAG}` });
  check('"back\\slash" finds only the backslash, not "backslash"', JSON.stringify(datesOf(q4Backslash)) === '["2007-01-05"]', summary(q4Backslash));

  section('Q5 — invalid requests → 400');
  const bad = [
    ['q missing', {}],
    ['q empty', { q: '' }],
    ['q of 1 character', { q: 'a' }],
    ['q of 201 characters', { q: 'x'.repeat(201) }],
    ['11 terms', { q: Array.from({ length: 11 }, (_, i) => `w${i}`).join(' ') }],
    ['offset -1', { q: MELGAR, offset: -1 }],
    ['offset 1.5', { q: MELGAR, offset: 1.5 }],
    ['offset "x"', { q: MELGAR, offset: 'x' }],
  ];
  for (const [name, body] of bad) {
    const r = await search(body);
    check(`${name} → 400 with errors`, r.status === 400 && r.body?.success === false && Array.isArray(r.body?.errors), summary(r));
  }
  const q5Echo = await search({ q: `${MELGAR} `.repeat(11) });
  check('a 400 never echoes the query (N2)', q5Echo.status === 400 && !JSON.stringify(q5Echo.body).includes(TAG), { status: q5Echo.status });

  section('Q6 — 61 matching days: 50, then 11; total 61 both times');
  const q6First = await search({ q: PAGED });
  const q6Second = await search({ q: PAGED, offset: 50 });
  const q6Past = await search({ q: PAGED, offset: 61 });
  const all = [...datesOf(q6First), ...datesOf(q6Second)];
  check('first page: 50 results, total 61', datesOf(q6First).length === 50 && q6First.body?.data?.total === 61, { n: datesOf(q6First).length, total: q6First.body?.data?.total });
  check('second page: 11 results, total 61, offset 50', datesOf(q6Second).length === 11 && q6Second.body?.data?.total === 61 && q6Second.body?.data?.offset === 50, { n: datesOf(q6Second).length });
  check('the two pages cover the 61 days once, newest first', new Set(all).size === 61 && all.every((d, i) => i === 0 || all[i - 1] > d) && all[0] === paged[60].date);
  check('an offset past the end → 0 results, total 61', q6Past.status === 200 && datesOf(q6Past).length === 0 && q6Past.body?.data?.total === 61, summary(q6Past));

  section('Q7 — isolation: each user finds only their own days');
  const q7B = await search({ q: MELGAR }, tokenB);
  check("B finds only its own day", JSON.stringify(datesOf(q7B)) === '["2012-03-03"]' && q7B.body?.data?.total === 1, summary(q7B));
  const q7BOnlyA = await search({ q: BEACH }, tokenB);
  check("B finds nothing that only A wrote", q7BOnlyA.status === 200 && q7BOnlyA.body?.data?.total === 0, summary(q7BOnlyA));
  check("A's count of the shared word ignores B's day", q3Upper.body?.data?.total === 3);

  section('S1 — the route needs a token; GET is not served, so a query never travels in a URL');
  const s1None = await http('POST', `${B}/search`, { body: { q: MELGAR } });
  check('no token → 401', s1None.status === 401, { status: s1None.status });
  const s1Bad = await http('POST', `${B}/search`, { token: 'not-a-token', body: { q: MELGAR } });
  check('invalid token → 401', s1Bad.status === 401, { status: s1Bad.status });
  const s1Get = await http('GET', `${B}/search?q=control`, { token: tokenA });
  check('GET /search → 404', s1Get.status === 404, { status: s1Get.status });

  // ═══════════════════════════ S5 / N2 — no text in any output ═══════════════════════════
  section('S5 — this run and the server log contain no query, snippet or entry text');
  check('this run printed no fixture or query word', !output.join('\n').includes(TAG));
  if (process.env.E2E_SERVER_LOG) {
    const log = fs.readFileSync(process.env.E2E_SERVER_LOG, 'utf8');
    check(`server log has no fixture or query word (${log.length} bytes checked)`, !log.includes(TAG));
  } else {
    console.log('  ⚠️  E2E_SERVER_LOG not set — server log not checked');
  }
});
