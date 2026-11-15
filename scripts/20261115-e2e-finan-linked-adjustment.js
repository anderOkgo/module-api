/* eslint-disable */
/**
 * E2E — Finanz: the linked adjustment follows deletes and edits (module-docs/apps/finan/SPEC.md v0.10, L.6 rows
 * J1–J9 with layer API; J10 and J11–J12 are unit and front tests). Doc: docs/changes/20261115-finan-linked-adjustment.md
 *
 * Requires:
 *   - the API on E2E_BASE_URL (default http://localhost:3001), built from this branch, on the LOCAL database;
 *   - E2E_USER_A / E2E_PASSWORD_A (.env.e2e.local): the dedicated test user, never the owner's account;
 *   - MYHOST / MYPORT / MYUSER / MYPASSWORD / MYDATABASEFINAN (.env), to read balances back.
 * Usage: node scripts/20261115-e2e-finan-linked-adjustment.js
 *
 * Data: two balance movements ("origins") and the movements that use them, named `__E2E_LINK_<run>_…`, all deleted
 * at the end. Expected 4xx on purpose: J8 (an origin that does not exist).
 * Negative control (J13): against a build with the undo on delete removed, J2 must FAIL.
 */
const { check, section, http, login, withDb, onCleanup, run } = require('./_e2e-helpers');

const runId = Date.now().toString().slice(-7);
const name = (what) => `__E2E_LINK_${runId}_${what}`;
const user = process.env.E2E_USER_A;
const table = `movements_${String(user).toLowerCase().trim()}`;
const today = new Date().toISOString().slice(0, 10);
let minute = 0;
const dateFor = () => `${today} 0${Math.floor(minute / 60)}:${String(minute++ % 60).padStart(2, '0')}:00`;

const db = (sql, params) => withDb('MYDATABASEFINAN', (q) => q(sql, params));
const valueOf = async (id) => Number((await db(`SELECT value FROM ${table} WHERE id = ?`, [id]))[0]?.value);
const idOf = async (movementName) => (await db(`SELECT id FROM ${table} WHERE name = ?`, [movementName]))[0]?.id;

run(async () => {
  if (!user) throw new Error('E2E_USER_A is not set (.env.e2e.local)');
  const token = await login(user, process.env.E2E_PASSWORD_A);
  check('setup: the test user logs in', !!token);
  // The initial load creates the user's movements table when it is missing
  const load = await http('POST', '/api/finan/initial-load', { token, body: { date: today, currency: 'COP' } });
  check('setup: the initial load answers', load.status < 300, load.status);
  onCleanup(async () => {
    await db(`DELETE FROM ${table} WHERE name LIKE ?`, [`__E2E_LINK_${runId}_%`]);
  });

  const send = (method, path, fields) =>
    http(method, `/api/finan/${path}`, {
      token,
      body: { movement_tag: 'e2e', currency: 'COP', movement_date: fields.movement_date || dateFor(), ...fields },
    });
  const create = async (what, type, value, origin) => {
    const res = await send('POST', 'insert', {
      movement_name: name(what),
      movement_val: value,
      movement_type: type,
      ...(origin ? { operate_for: origin } : {}),
    });
    return { res, id: await idOf(name(what)) };
  };
  const edit = (id, what, type, value, origin) =>
    send('PUT', `update/${id}`, {
      movement_name: name(what),
      movement_val: value,
      movement_type: type,
      ...(origin ? { operate_for: origin } : {}),
    });
  const remove = (id) => http('DELETE', `/api/finan/delete/${id}`, { token, body: { username: user } });

  section('Setup — two origin balances of 1,000');
  const a = (await create('originA', 8, 1000)).id;
  const b = (await create('originB', 8, 1000)).id;
  check('setup: both origins exist with 1,000', (await valueOf(a)) === 1000 && (await valueOf(b)) === 1000);

  section('J1 — an expense of 50 with origin A');
  const e = await create('expense', 2, 50, a);
  check('J1 the expense is created (2xx)', e.res.status < 300 && !!e.id, e.res);
  check('J1 origin A is 950', (await valueOf(a)) === 950, await valueOf(a));

  section('J4 — edit it from 50 to 80');
  const j4 = await edit(e.id, 'expense', 2, 80, a);
  check('J4 the edit is accepted', j4.status < 300, j4);
  check('J4 origin A is 920', (await valueOf(a)) === 920, await valueOf(a));

  section('J5 — edit it from expense to income (80)');
  await edit(e.id, 'expense', 1, 80, a);
  check('J5 origin A is 1,080 (80 back, 80 added)', (await valueOf(a)) === 1080, await valueOf(a));

  section('J6 — move it from origin A to origin B');
  await edit(e.id, 'expense', 1, 80, b);
  check('J6 origin A is back to 1,000', (await valueOf(a)) === 1000, await valueOf(a));
  check('J6 origin B is 1,080', (await valueOf(b)) === 1080, await valueOf(b));

  section('J7 — remove its origin');
  await edit(e.id, 'expense', 1, 80, null);
  check('J7 origin B is back to 1,000', (await valueOf(b)) === 1000, await valueOf(b));

  section('J8 — edit to an origin that does not exist');
  await edit(e.id, 'expense', 2, 50, a); // back to an expense of 50 on A: A = 950
  const before = await valueOf(a);
  const j8 = await edit(e.id, 'expense', 2, 60, 999999999);
  check('J8 answers 400', j8.status === 400, j8);
  check('J8 … "Linked movement not found"', JSON.stringify(j8.body).includes('Linked movement not found'), j8.body);
  check('J8 origin A unchanged (the undo rolled back)', (await valueOf(a)) === before, await valueOf(a));
  const row = (await db(`SELECT value, log FROM ${table} WHERE id = ?`, [e.id]))[0];
  check('J8 the movement unchanged', Number(row.value) === 50 && Number(row.log) === a, row);

  section('J2 — delete the expense');
  const j2 = await remove(e.id);
  check('J2 the delete is accepted', j2.status < 300, j2);
  check('J2 origin A is back to 1,000', (await valueOf(a)) === 1000, await valueOf(a));

  section('J3 — an income of 50 with origin B, then deleted');
  const i = await create('income', 1, 50, b);
  check('J3 origin B is 1,050', (await valueOf(b)) === 1050, await valueOf(b));
  await remove(i.id);
  check('J3 origin B is back to 1,000', (await valueOf(b)) === 1000, await valueOf(b));

  section('J9 — delete a movement whose origin was deleted');
  const orphan = await create('orphan', 2, 30, b);
  await remove(b);
  const j9 = await remove(orphan.id);
  check('J9 the delete is accepted', j9.status < 300, j9);
  check('J9 the movement is gone', !(await idOf(name('orphan'))));
});
