#!/usr/bin/env node
/**
 * Standalone HTTP smoke test — simulates a frontend hitting a *running*
 * instance of this API (local dev, staging, or production) and confirms
 * every endpoint responds as expected. Meant to run after a deploy, not on
 * every commit (that's what `npm test` + CI already cover with mocked/
 * real-but-disposable data — see test/integration/ and test/e2e/).
 *
 * This is also the one layer of this project's test pyramid that's
 * language-agnostic: it only speaks HTTP to a URL, with zero imports from
 * src/, unlike test/integration and test/e2e (which both build the Express
 * app in-process from this codebase's own TypeScript). That makes it the
 * closest thing to a portable acceptance contract — see
 * docs/specification-roadmap.md, Phase 7, for what that means and what's
 * still needed before it's a complete one (today it's smoke-level coverage,
 * not an exhaustive one).
 *
 * Two tiers of checks:
 *   1. Always run, no credentials needed: app-level health, every public
 *      series endpoint, every auth-gate negative path (missing/invalid
 *      token), and auth negative paths (bad login, invalid email). These
 *      never create, modify, or delete anything.
 *   2. Only run if real credentials are supplied: a full CRUD cycle against
 *      every mutating endpoint (create/update/assign/remove/delete series,
 *      insert/update/delete a finan movement), using disposable,
 *      distinctively-named fixtures that are cleaned up at the end — the
 *      same pattern test/e2e/ uses against the real database. Also, only
 *      when the configured account's username genuinely has an uppercase
 *      letter: a regression check for the username-casing bug fixed in
 *      Phase 6 (docs/specification-roadmap.md) — skipped with a clear
 *      reason otherwise, since a brand-new mixed-case account can't be
 *      registered through this script (see the registration limitation
 *      note further down).
 *
 * Credentials are never hardcoded or passed as CLI args (that would leak
 * into shell history / process listings). Supply them as environment
 * variables — the script auto-loads `.env.smoke.local` (gitignored) if
 * present:
 *
 *   SMOKE_ADMIN_LOGIN / SMOKE_ADMIN_PASSWORD  — real admin account; unlocks
 *     the full series CRUD cycle (create/update/assign genres/add titles/
 *     upload image/remove genres/remove titles/soft-delete) via a real
 *     POST /login call.
 *   SMOKE_USER_LOGIN / SMOKE_USER_PASSWORD    — real user account; unlocks
 *     GET /api/series/list and the full finan movement CRUD cycle. If
 *     omitted but an admin login is supplied, the admin token is reused for
 *     these checks (a valid token is all validateToken requires).
 *   SMOKE_ADMIN_TOKEN / SMOKE_USER_TOKEN      — pre-minted JWTs, used
 *     instead of logging in for real if you'd rather not send a real
 *     password over the wire (e.g. against production).
 *
 * Usage:
 *   node scripts/smoke-test.js [baseUrl]
 *   BASE_URL=https://info.animecream.com node scripts/smoke-test.js
 *   npm run smoke -- http://localhost:3001
 *
 * Exit code 0 if every check passes, 1 otherwise — suitable as a deploy-
 * pipeline gate.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.smoke.local') });

const axios = require('axios');
const FormData = require('form-data');

const baseUrl = (process.argv[2] || process.env.BASE_URL || 'http://localhost:3001').replace(/\/$/, '');

const adminLogin = process.env.SMOKE_ADMIN_LOGIN;
const adminPassword = process.env.SMOKE_ADMIN_PASSWORD;
const userLogin = process.env.SMOKE_USER_LOGIN;
const userPassword = process.env.SMOKE_USER_PASSWORD;

// A minimal but genuinely valid 1x1 PNG — the real (unmocked) sharp-based
// image pipeline needs real image bytes to process, not a placeholder.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

const client = axios.create({
  baseURL: baseUrl,
  timeout: 15000,
  validateStatus: () => true, // we assert on status ourselves, never throw on 4xx/5xx
});

const results = [];

function describeError(error) {
  // Network-level failures (e.g. ECONNREFUSED) can have an empty .message
  // depending on the Node/axios version — fall back to .code, then the
  // stringified error, so a failure is never reported with a blank reason.
  return error.message || error.code || String(error);
}

async function check(name, fn) {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  \x1b[32m✓\x1b[0m ${name}`);
  } catch (error) {
    const message = describeError(error);
    results.push({ name, ok: false, error: message });
    console.log(`  \x1b[31m✗\x1b[0m ${name}`);
    console.log(`    ${message}`);
  }
}

function assertStatus(res, expected, context) {
  const expectedList = Array.isArray(expected) ? expected : [expected];
  if (!expectedList.includes(res.status)) {
    throw new Error(
      `${context}: expected status ${expectedList.join(' or ')}, got ${res.status} — ${JSON.stringify(res.data).slice(0, 200)}`
    );
  }
}

function assertHas(obj, path_, context) {
  const value = path_.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
  if (value === undefined) {
    throw new Error(`${context}: expected field "${path_}" in response, got ${JSON.stringify(obj).slice(0, 200)}`);
  }
}

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

async function loginReal(identifier, password) {
  const res = await client.post('/api/users/login', { username: identifier, password });
  if (res.status !== 200 || !res.data.token) {
    throw new Error(
      `login failed for "${identifier}": expected 200 with a token, got ${res.status} — ${JSON.stringify(res.data).slice(0, 200)}`
    );
  }
  return res.data.token;
}

async function main() {
  console.log(`\nSmoke testing ${baseUrl}\n`);

  let genreIds = [];
  let demographyId;

  console.log('App-level:');
  await check('GET / responds', async () => {
    const res = await client.get('/');
    assertStatus(res, 200, 'GET /');
    assertHas(res.data, 'msg', 'GET /');
  });
  await check('GET /health reports service status', async () => {
    const res = await client.get('/health');
    assertStatus(res, [200, 503], 'GET /health');
    assertHas(res.data, 'status', 'GET /health');
    assertHas(res.data, 'services.database', 'GET /health');
  });
  await check('GET /api responds', async () => {
    const res = await client.get('/api');
    assertStatus(res, 200, 'GET /api');
  });
  await check('GET /api-docs serves Swagger UI', async () => {
    const res = await client.get('/api-docs/');
    assertStatus(res, 200, 'GET /api-docs/');
  });
  await check('Unknown route returns a JSON 404', async () => {
    const res = await client.get('/this-route-should-not-exist');
    assertStatus(res, 404, 'GET /this-route-should-not-exist');
    assertHas(res.data, 'error', 'GET /this-route-should-not-exist');
  });

  console.log('\nSeries module (public endpoints):');
  await check('GET /api/series/years responds', async () => {
    const res = await client.get('/api/series/years');
    assertStatus(res, 200, 'GET /api/series/years');
  });
  await check('GET /api/series/genres returns the catalog', async () => {
    const res = await client.get('/api/series/genres');
    assertStatus(res, 200, 'GET /api/series/genres');
    assertHas(res.data, 'genres', 'GET /api/series/genres');
    genreIds = (res.data.genres || []).map((g) => g.id).slice(0, 2);
  });
  await check('GET /api/series/demographics returns the catalog', async () => {
    const res = await client.get('/api/series/demographics');
    assertStatus(res, 200, 'GET /api/series/demographics');
    assertHas(res.data, 'demographics', 'GET /api/series/demographics');
    demographyId = (res.data.demographics || [])[0] && res.data.demographics[0].id;
  });
  await check('POST /api/series/search responds', async () => {
    const res = await client.post('/api/series/search', {});
    assertStatus(res, 200, 'POST /api/series/search');
    assertHas(res.data, 'data', 'POST /api/series/search');
  });
  await check('POST /api/series/ (boot endpoint) responds', async () => {
    const res = await client.post('/api/series/', { limit: 1 });
    assertStatus(res, 200, 'POST /api/series/');
  });
  await check('GET /api/series/:id returns 404 for a nonexistent id', async () => {
    const res = await client.get('/api/series/999999999');
    assertStatus(res, 404, 'GET /api/series/999999999');
  });

  console.log('\nAuth gates (negative paths — no credentials required):');
  await check('GET /api/series/list requires a token', async () => {
    const res = await client.get('/api/series/list');
    assertStatus(res, 401, 'GET /api/series/list without token');
  });
  await check('POST /api/series/create requires an admin token', async () => {
    const res = await client.post('/api/series/create', {});
    assertStatus(res, 401, 'POST /api/series/create without token');
  });
  await check('POST /api/finan/initial-load requires a token', async () => {
    const res = await client.post('/api/finan/initial-load', {});
    assertStatus(res, 401, 'POST /api/finan/initial-load without token');
  });

  console.log('\nAuth module (negative paths — never creates a real user):');
  await check('POST /api/users/login rejects bogus credentials', async () => {
    const res = await client.post('/api/users/login', {
      username: 'this-user-should-not-exist',
      password: 'wrong-password',
    });
    assertStatus(res, 400, 'POST /api/users/login with bogus credentials');
  });
  await check('POST /api/users/add rejects an invalid email', async () => {
    const res = await client.post('/api/users/add', {
      first_name: 'Smoke',
      last_name: 'Test',
      username: 'smoketest',
      email: 'not-an-email',
      password: 'irrelevant',
    });
    assertStatus(res, 400, 'POST /api/users/add with an invalid email');
  });
  console.log(
    '  (Not tested: real registration success — step 2 requires reading a verification code\n' +
      '   emailed by a real SMTP send, which this script cannot receive. See test/e2e/auth.e2e.test.ts,\n' +
      '   which covers it with a mocked email transport.)'
  );

  // ---- Resolve real tokens (real login, not pre-minted, unless a token was
  // supplied directly) ----------------------------------------------------
  let adminToken = process.env.SMOKE_ADMIN_TOKEN;
  let userToken = process.env.SMOKE_USER_TOKEN;
  // Which identifier ended up backing userToken, if we know it (a
  // pre-minted SMOKE_USER_TOKEN has no known identifier) — used below to
  // decide whether the username-casing regression check can run for real.
  let userIdentifier;

  if (adminLogin && adminPassword) {
    console.log('\nAuth module (real login):');
    await check('POST /api/users/login succeeds with real admin credentials', async () => {
      adminToken = await loginReal(adminLogin, adminPassword);
    });
  }
  if (userLogin && userPassword && userLogin !== adminLogin) {
    await check('POST /api/users/login succeeds with real user credentials', async () => {
      userToken = await loginReal(userLogin, userPassword);
    });
    userIdentifier = userLogin;
  } else if (!userToken && adminToken) {
    // Same account for both roles, or only an admin login supplied — a
    // valid token is all validateToken (non-admin routes) requires.
    userToken = adminToken;
    userIdentifier = adminLogin;
  }

  // ---- User-tier authenticated checks ------------------------------------
  if (userToken) {
    console.log('\nSeries module (authenticated):');
    await check('GET /api/series/list succeeds with a valid token', async () => {
      const res = await client.get('/api/series/list', { headers: authHeader(userToken) });
      assertStatus(res, 200, 'GET /api/series/list with token');
    });

    console.log('\nFinan module (authenticated — full CRUD, cleans up after itself):');
    const suffix = Date.now().toString().slice(-8);
    const movementName = `SMOKE_TEST_MOVEMENT_${suffix}`;
    let movementId;

    await check('POST /api/finan/insert creates a real movement', async () => {
      const res = await client.post(
        '/api/finan/insert',
        {
          movement_name: movementName,
          movement_val: 1,
          movement_date: '2026-01-01',
          movement_type: 1, // income
          movement_tag: 'smoke-test',
          currency: 'COP',
        },
        { headers: authHeader(userToken) }
      );
      assertStatus(res, 201, 'POST /api/finan/insert');
      movementId = res.data.data && res.data.data.id;
      if (!movementId) throw new Error('no movement id returned');
    });

    // Acceptance criterion #6: the real type_sources catalog has 9 rows
    // (income/expense/saving/balance/tax return/GYG payment/interest/visa
    // refund/cash exchange), but MovementType only defines 3 (1, 2, 8) and
    // validation rejects everything else — so 6 real, historically-used
    // categories (e.g. 13 = "cash exchange") can never be created via the
    // API today. Assert that limitation is real, not assumed.
    await check(
      'POST /api/finan/insert rejects a movement_type outside {1, 2, 8} (real type-catalog gap)',
      async () => {
        const res = await client.post(
          '/api/finan/insert',
          {
            movement_name: `SMOKE_TEST_BADTYPE_${suffix}`,
            movement_val: 1,
            movement_date: '2026-01-01',
            movement_type: 13, // "cash exchange" in the real type_sources catalog — not in the app's enum
            movement_tag: 'smoke-test',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(res, 400, 'POST /api/finan/insert with movement_type: 13');
      }
    );

    if (movementId) {
      await check('POST /api/finan/initial-load reflects the created movement', async () => {
        const res = await client.post(
          '/api/finan/initial-load',
          { currency: 'COP' },
          { headers: authHeader(userToken) }
        );
        assertStatus(res, 200, 'POST /api/finan/initial-load');
        const found = ((res.data.data && res.data.data.movements) || []).some((m) => m.id === movementId);
        if (!found) throw new Error('created movement not present in initial-load response');
      });

      await check('PUT /api/finan/update/:id updates the movement', async () => {
        const res = await client.put(
          `/api/finan/update/${movementId}`,
          {
            movement_name: `${movementName}_UPDATED`,
            movement_val: 2,
            movement_date: '2026-01-02',
            movement_type: 1,
            movement_tag: 'smoke-test',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(res, 200, 'PUT /api/finan/update/:id');
      });

      await check('DELETE /api/finan/delete/:id removes the movement for real', async () => {
        const res = await client.delete(`/api/finan/delete/${movementId}`, { headers: authHeader(userToken) });
        assertStatus(res, 200, 'DELETE /api/finan/delete/:id');
      });

      // Acceptance criterion #4: finan movements are hard-deleted (unlike
      // series, which are soft-deleted — see the series-side check below).
      // Confirm it via a follow-up read, not just the 200 on DELETE itself.
      await check('confirms the finan movement is really gone (hard delete, via a follow-up initial-load)', async () => {
        const res = await client.post(
          '/api/finan/initial-load',
          { currency: 'COP' },
          { headers: authHeader(userToken) }
        );
        assertStatus(res, 200, 'POST /api/finan/initial-load (post-delete)');
        const stillPresent = ((res.data.data && res.data.data.movements) || []).some((m) => m.id === movementId);
        if (stillPresent) throw new Error('movement still present in initial-load after delete');
      });
    }

    // Acceptance criterion #11: re-submitting the same movement (same name +
    // date) returns the *original*, untouched record instead of updating it
    // — a materially different upsert semantic from series (criterion #5),
    // which does update on a name+year collision.
    const dupName = `SMOKE_TEST_DUP_${suffix}`;
    let dupId;
    await check(
      'POST /api/finan/insert twice with the same name+date returns the original value, not the second call\'s',
      async () => {
        const first = await client.post(
          '/api/finan/insert',
          {
            movement_name: dupName,
            movement_val: 11,
            movement_date: '2026-01-05',
            movement_type: 1,
            movement_tag: 'smoke-test-dup',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(first, 201, 'POST /api/finan/insert (duplicate check, first call)');
        dupId = first.data.data && first.data.data.id;
        if (!dupId) throw new Error('no movement id returned');

        const second = await client.post(
          '/api/finan/insert',
          {
            movement_name: dupName,
            movement_val: 999, // deliberately different — must be ignored
            movement_date: '2026-01-05',
            movement_type: 1,
            movement_tag: 'smoke-test-dup',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(second, 201, 'POST /api/finan/insert (duplicate check, second call)');
        const secondId = second.data.data && second.data.data.id;
        if (secondId !== dupId) {
          throw new Error(`expected the same movement id (${dupId}) on the duplicate call, got ${secondId}`);
        }
        if (Number(second.data.data.value) !== 11) {
          throw new Error(`expected the original value (11) to survive the duplicate call, got ${second.data.data.value}`);
        }
      }
    );
    if (dupId) {
      await check('DELETE /api/finan/delete/:id removes the duplicate-check fixture', async () => {
        const res = await client.delete(`/api/finan/delete/${dupId}`, { headers: authHeader(userToken) });
        assertStatus(res, 200, 'DELETE /api/finan/delete/:id (duplicate-check cleanup)');
      });
    }

    // Acceptance criterion #10: creating a movement with operate_for adjusts
    // the VALUE of the referenced, earlier movement — add if the new
    // movement is income, subtract if expense/balance — before the new
    // movement is even inserted. One-way; the "log" column (not shown
    // directly in the HTTP response, but implied by this behavior) is the
    // linked movement's id, not an audit log.
    const linkBaseName = `SMOKE_TEST_LINKBASE_${suffix}`;
    const linkAdjustName = `SMOKE_TEST_LINKADJUST_${suffix}`;
    let linkBaseId;
    let linkAdjustId;
    await check(
      'creating a movement with operate_for adjusts the value of the movement it references',
      async () => {
        const baseRes = await client.post(
          '/api/finan/insert',
          {
            movement_name: linkBaseName,
            movement_val: 100,
            movement_date: '2026-01-06',
            movement_type: 8, // "balance" — the kind of movement operate_for typically adjusts
            movement_tag: 'smoke-test-link',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(baseRes, 201, 'POST /api/finan/insert (link base)');
        linkBaseId = baseRes.data.data && baseRes.data.data.id;
        if (!linkBaseId) throw new Error('no movement id returned for the link base');

        const adjustRes = await client.post(
          '/api/finan/insert',
          {
            movement_name: linkAdjustName,
            movement_val: 30,
            movement_date: '2026-01-07',
            movement_type: 2, // expense — subtracts from the linked movement
            movement_tag: 'smoke-test-link',
            currency: 'COP',
            operate_for: linkBaseId,
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(adjustRes, 201, 'POST /api/finan/insert (linked adjustment)');
        linkAdjustId = adjustRes.data.data && adjustRes.data.data.id;
        if (!linkAdjustId) throw new Error('no movement id returned for the adjusting movement');

        const loadRes = await client.post(
          '/api/finan/initial-load',
          { currency: 'COP' },
          { headers: authHeader(userToken) }
        );
        assertStatus(loadRes, 200, 'POST /api/finan/initial-load (after linked adjustment)');
        const baseAfter = ((loadRes.data.data && loadRes.data.data.movements) || []).find((m) => m.id === linkBaseId);
        if (!baseAfter) throw new Error('link base movement not found after the adjustment');
        if (Number(baseAfter.val) !== 70) {
          throw new Error(`expected the link base's value to become 70 (100 - 30), got ${baseAfter.val}`);
        }
      }
    );
    if (linkAdjustId) {
      await check('DELETE /api/finan/delete/:id removes the linked-adjustment fixture', async () => {
        const res = await client.delete(`/api/finan/delete/${linkAdjustId}`, { headers: authHeader(userToken) });
        assertStatus(res, 200, 'DELETE /api/finan/delete/:id (link-adjustment cleanup)');
      });
    }
    if (linkBaseId) {
      await check('DELETE /api/finan/delete/:id removes the link-base fixture', async () => {
        const res = await client.delete(`/api/finan/delete/${linkBaseId}`, { headers: authHeader(userToken) });
        assertStatus(res, 200, 'DELETE /api/finan/delete/:id (link-base cleanup)');
      });
    }

    // Regression (see docs/specification-roadmap.md, Phase 6): registration
    // allows uppercase usernames, and update/delete used to build the wrong
    // (nonexistent) movements_<username> table for any account whose
    // username had an uppercase letter — create worked, edit/delete always
    // failed with "Movement not found". This script can't register a
    // brand-new mixed-case account itself (blocked by real email
    // verification, same limitation as everything else here), so it only
    // runs for real when the *configured* account genuinely has a
    // mixed-case username — skips with a clear reason otherwise rather than
    // faking it.
    if (userIdentifier && /[A-Z]/.test(userIdentifier)) {
      console.log(`\nFinan module (username-casing regression — account: ${userIdentifier}):`);
      const mixedCaseSuffix = Date.now().toString().slice(-8);
      const mixedCaseName = `SMOKE_TEST_MIXEDCASE_${mixedCaseSuffix}`;
      let mixedCaseId;

      await check('creates, updates, and deletes a movement for the real mixed-case account', async () => {
        const createRes = await client.post(
          '/api/finan/insert',
          {
            movement_name: mixedCaseName,
            movement_val: 1,
            movement_date: '2026-01-01',
            movement_type: 1,
            movement_tag: 'smoke-test-mixed-case',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(createRes, 201, 'POST /api/finan/insert (mixed-case account)');
        mixedCaseId = createRes.data.data && createRes.data.data.id;
        if (!mixedCaseId) throw new Error('no movement id returned');

        const updateRes = await client.put(
          `/api/finan/update/${mixedCaseId}`,
          {
            movement_name: `${mixedCaseName}_UPDATED`,
            movement_val: 2,
            movement_date: '2026-01-02',
            movement_type: 1,
            movement_tag: 'smoke-test-mixed-case',
            currency: 'COP',
          },
          { headers: authHeader(userToken) }
        );
        assertStatus(updateRes, 200, 'PUT /api/finan/update/:id (mixed-case account)');

        const deleteRes = await client.delete(`/api/finan/delete/${mixedCaseId}`, {
          headers: authHeader(userToken),
        });
        assertStatus(deleteRes, 200, 'DELETE /api/finan/delete/:id (mixed-case account)');
      });
    } else {
      console.log(
        '\n(Skipping username-casing regression check — the configured account has no ' +
          'uppercase letters. Set SMOKE_USER_LOGIN or SMOKE_ADMIN_LOGIN to a real account ' +
          'with a mixed-case username to exercise this for real.)'
      );
    }
  } else {
    console.log(
      '\n(Skipping user-tier checks — set SMOKE_USER_LOGIN/SMOKE_USER_PASSWORD, ' +
        'SMOKE_ADMIN_LOGIN/SMOKE_ADMIN_PASSWORD, or SMOKE_USER_TOKEN.)'
    );
  }

  // ---- Admin-tier authenticated checks -----------------------------------
  if (adminToken) {
    console.log('\nSeries module (admin — full CRUD, cleans up after itself):');
    const suffix = Date.now().toString().slice(-8);
    const seriesName = `__SMOKE_TEST_SERIES_${suffix}__`;
    let seriesId;

    await check('POST /api/series/create creates a real series (multipart)', async () => {
      const form = new FormData();
      form.append('name', seriesName);
      form.append('chapter_number', '1');
      form.append('year', '2026');
      form.append('description', 'Smoke test series');
      form.append('description_en', 'Smoke test series EN');
      form.append('qualification', '8');
      if (demographyId) form.append('demography_id', String(demographyId));
      form.append('visible', 'true');
      form.append('image', TINY_PNG, { filename: 'cover.png', contentType: 'image/png' });

      const res = await client.post('/api/series/create', form, {
        headers: { ...form.getHeaders(), ...authHeader(adminToken) },
      });
      assertStatus(res, 201, 'POST /api/series/create');
      seriesId = res.data.data && res.data.data.id;
      if (!seriesId) throw new Error('no series id returned');
    });

    if (seriesId) {
      await check('GET /api/series/:id retrieves the created series', async () => {
        const res = await client.get(`/api/series/${seriesId}`);
        assertStatus(res, 200, 'GET /api/series/:id');
        if (res.data.data.name !== seriesName) throw new Error('name mismatch on retrieval');
      });

      // Acceptance criterion #2 (docs/specification-roadmap.md): visible must
      // round-trip as a real JSON boolean, never the raw MySQL 0/1 — the
      // admin panel reloads a series via GET and submits that exact value
      // back on PUT if the user never touches the checkbox.
      await check('GET /api/series/:id returns visible as a real JSON boolean, not a raw 0/1', async () => {
        const res = await client.get(`/api/series/${seriesId}`);
        assertStatus(res, 200, 'GET /api/series/:id (visible type check)');
        if (typeof res.data.data.visible !== 'boolean') {
          throw new Error(
            `expected visible to be a boolean, got ${typeof res.data.data.visible} (${JSON.stringify(res.data.data.visible)})`
          );
        }
      });

      await check(
        'does not silently hide the series when the edit form round-trips the GET value unchanged (real prod incident)',
        async () => {
          // Mirrors the actual flow that broke production: GET seeds the
          // checkbox, and if the user never touches it, that same value is
          // submitted back on PUT as a real JSON body (not multipart).
          const getRes = await client.get(`/api/series/${seriesId}`);
          assertStatus(getRes, 200, 'GET /api/series/:id (round-trip)');
          const roundTrippedVisible = getRes.data.data.visible;
          if (roundTrippedVisible !== true) throw new Error('expected the series to still be visible at this point');

          const putRes = await client.put(
            `/api/series/${seriesId}`,
            { name: seriesName, visible: roundTrippedVisible },
            { headers: authHeader(adminToken) }
          );
          assertStatus(putRes, 200, 'PUT /api/series/:id (round-trip)');

          const refetch = await client.get(`/api/series/${seriesId}`);
          if (refetch.data.data.visible !== true) {
            throw new Error('series was silently hidden after round-tripping an unchanged visible value');
          }
        }
      );

      // Acceptance criterion #1: qualification is never stored verbatim —
      // update_rank() re-ranks and re-normalizes it (7.000-9.700) across the
      // whole catalog after every write. Assert the *behavior* (result lands
      // in the rescaled range and DB/response agree), not the submitted value.
      await check(
        'PUT /api/series/:id updates the series (multipart) — qualification is rescaled, not stored verbatim',
        async () => {
          const form = new FormData();
          form.append('qualification', '7.5');
          const res = await client.put(`/api/series/${seriesId}`, form, {
            headers: { ...form.getHeaders(), ...authHeader(adminToken) },
          });
          assertStatus(res, 200, 'PUT /api/series/:id');

          const returnedQualification = res.data.data && res.data.data.qualification;
          if (returnedQualification === undefined) throw new Error('no qualification in the PUT response');
          if (returnedQualification < 7 || returnedQualification > 9.7) {
            throw new Error(`qualification ${returnedQualification} outside the expected 7.0-9.7 rescale range`);
          }

          const refetch = await client.get(`/api/series/${seriesId}`);
          if (refetch.data.data.qualification !== returnedQualification) {
            throw new Error('qualification in the DB does not match the PUT response');
          }
        }
      );

      await check('PUT /api/series/:id/image uploads a new cover image', async () => {
        const form = new FormData();
        form.append('image', TINY_PNG, { filename: 'cover2.png', contentType: 'image/png' });
        const res = await client.put(`/api/series/${seriesId}/image`, form, {
          headers: { ...form.getHeaders(), ...authHeader(adminToken) },
        });
        assertStatus(res, 200, 'PUT /api/series/:id/image');
      });

      if (genreIds.length > 0) {
        await check('POST /api/series/:id/genres rejects an unknown genre id', async () => {
          const res = await client.post(
            `/api/series/${seriesId}/genres`,
            { genreIds: [999999] },
            { headers: authHeader(adminToken) }
          );
          assertStatus(res, 400, 'POST /api/series/:id/genres with an unknown id');
        });

        await check('POST /api/series/:id/genres assigns real genres', async () => {
          const res = await client.post(
            `/api/series/${seriesId}/genres`,
            { genreIds },
            { headers: authHeader(adminToken) }
          );
          assertStatus(res, 200, 'POST /api/series/:id/genres');
        });

        await check('DELETE /api/series/:id/genres removes one genre', async () => {
          const res = await client.delete(`/api/series/${seriesId}/genres`, {
            headers: authHeader(adminToken),
            data: { genreIds: [genreIds[0]] },
          });
          assertStatus(res, 200, 'DELETE /api/series/:id/genres');
        });
      }

      let titleIds = [];
      await check('POST /api/series/:id/titles adds alternative titles', async () => {
        const res = await client.post(
          `/api/series/${seriesId}/titles`,
          { titles: ['Smoke Alt Title 1', 'Smoke Alt Title 2'] },
          { headers: authHeader(adminToken) }
        );
        assertStatus(res, 200, 'POST /api/series/:id/titles');
      });

      await check('GET /api/series/:id reflects genres and titles', async () => {
        const res = await client.get(`/api/series/${seriesId}`);
        assertStatus(res, 200, 'GET /api/series/:id (after genres/titles)');
        titleIds = (res.data.data.titles || []).map((t) => t.id);
        if (titleIds.length !== 2) throw new Error(`expected 2 titles, got ${titleIds.length}`);
      });

      if (titleIds.length > 0) {
        await check('DELETE /api/series/:id/titles removes the alternative titles', async () => {
          const res = await client.delete(`/api/series/${seriesId}/titles`, {
            headers: authHeader(adminToken),
            data: { titleIds },
          });
          assertStatus(res, 200, 'DELETE /api/series/:id/titles');
        });
      }

      await check('DELETE /api/series/:id soft-deletes the series', async () => {
        const res = await client.delete(`/api/series/${seriesId}`, { headers: authHeader(adminToken) });
        assertStatus(res, 200, 'DELETE /api/series/:id');
      });
      console.log(
        '    (DELETE is a soft delete — visible=0. The HTTP API has no hard-delete\n' +
          '     endpoint, so the disposable row stays in the table, just hidden.)'
      );

      // Acceptance criterion #4: series are soft-deleted (unlike finan
      // movements, which are hard-deleted). Confirm the row genuinely still
      // exists and is just hidden, not just that DELETE returned 200.
      await check('confirms the soft-deleted series still exists with visible=false (not a real delete)', async () => {
        const res = await client.get(`/api/series/${seriesId}`);
        assertStatus(res, 200, 'GET /api/series/:id (after soft-delete)');
        if (res.data.data.visible !== false) throw new Error('expected visible=false after soft-delete');
      });
    }

    console.log('\nSeries module (admin — create-complete, JSON body, cleans up after itself):');
    let completeSeriesId;
    await check('POST /api/series/create-complete creates a series with genres+titles in one call', async () => {
      const res = await client.post(
        '/api/series/create-complete',
        {
          name: `__SMOKE_TEST_COMPLETE_${suffix}__`,
          chapter_number: 1,
          year: 2026,
          description: 'Smoke test complete series',
          description_en: 'Smoke test complete series EN',
          qualification: 8,
          demography_id: demographyId,
          visible: true,
          genres: genreIds,
          titles: ['Smoke Complete Alt Title'],
        },
        { headers: authHeader(adminToken) }
      );
      assertStatus(res, 201, 'POST /api/series/create-complete');
      completeSeriesId = res.data.id;
      if (!completeSeriesId) throw new Error('no series id returned');
    });
    if (completeSeriesId) {
      await check('DELETE /api/series/:id soft-deletes the create-complete series', async () => {
        const res = await client.delete(`/api/series/${completeSeriesId}`, { headers: authHeader(adminToken) });
        assertStatus(res, 200, 'DELETE /api/series/:id (create-complete cleanup)');
      });
    }

    // Acceptance criterion #5: POST /api/series/create is really an
    // upsert-by-(name, year) — a second create call with the same name+year
    // must update the existing row instead of creating a duplicate. The
    // endpoint name suggests create-only; the real behavior doesn't.
    console.log('\nSeries module (admin — create is really upsert-by-name+year):');
    const upsertSuffix = Date.now().toString().slice(-8);
    const upsertName = `__SMOKE_TEST_UPSERT_${upsertSuffix}__`;
    const upsertYear = 2025;
    let upsertId;

    await check('POST /api/series/create with a new name+year creates a series', async () => {
      const form = new FormData();
      form.append('name', upsertName);
      form.append('chapter_number', '1');
      form.append('year', String(upsertYear));
      form.append('description', 'First version');
      form.append('description_en', 'First version EN');
      form.append('qualification', '8');
      if (demographyId) form.append('demography_id', String(demographyId));
      form.append('visible', 'true');

      const res = await client.post('/api/series/create', form, {
        headers: { ...form.getHeaders(), ...authHeader(adminToken) },
      });
      assertStatus(res, 201, 'POST /api/series/create (upsert, first call)');
      upsertId = res.data.data && res.data.data.id;
      if (!upsertId) throw new Error('no series id returned');
    });

    if (upsertId) {
      await check(
        'POST /api/series/create with the same name+year updates the existing series instead of duplicating it',
        async () => {
          const form = new FormData();
          form.append('name', upsertName);
          form.append('chapter_number', '1');
          form.append('year', String(upsertYear));
          form.append('description', 'Second version — should update, not duplicate');
          form.append('description_en', 'Second version EN');
          form.append('qualification', '9');
          if (demographyId) form.append('demography_id', String(demographyId));
          form.append('visible', 'true');

          const res = await client.post('/api/series/create', form, {
            headers: { ...form.getHeaders(), ...authHeader(adminToken) },
          });
          assertStatus(res, 201, 'POST /api/series/create (upsert, second call)');
          const secondId = res.data.data && res.data.data.id;
          if (secondId !== upsertId) {
            throw new Error(
              `expected the same series id (${upsertId}) on the second create, got ${secondId} — a duplicate row was created`
            );
          }
          if (res.data.data.description !== 'Second version — should update, not duplicate') {
            throw new Error('description was not updated by the second create call');
          }
        }
      );

      await check('DELETE /api/series/:id soft-deletes the upsert-test series', async () => {
        const res = await client.delete(`/api/series/${upsertId}`, { headers: authHeader(adminToken) });
        assertStatus(res, 200, 'DELETE /api/series/:id (upsert cleanup)');
      });
    }
  } else {
    console.log('\n(Skipping admin-tier checks — set SMOKE_ADMIN_LOGIN/SMOKE_ADMIN_PASSWORD or SMOKE_ADMIN_TOKEN.)');
  }

  console.log('');
  const failed = results.filter((r) => !r.ok);
  const passed = results.length - failed.length;
  console.log(`${passed}/${results.length} checks passed.`);

  if (failed.length > 0) {
    console.log('\nFailed checks:');
    failed.forEach((r) => console.log(`  - ${r.name}: ${r.error}`));
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('\nSmoke test crashed unexpectedly:', error.message);
  process.exitCode = 1;
});
