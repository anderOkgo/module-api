/* eslint-disable */
/**
 * Shared E2E boilerplate (module-docs DEVELOPMENT-PROCESS.md, template C.3, adapted to this
 * repo: `mysql` driver, `/api/users/login`, entry text redacted). Each script requires it;
 * state is per process.
 *
 * Env (loaded from .env, then .env.e2e.local — both gitignored):
 *   E2E_BASE_URL (default http://localhost:3001), E2E_ALLOW_REMOTE=1 to target a non-local host,
 *   MYHOST / MYPORT / MYUSER / MYPASSWORD + the module's MYDATABASE* var for withDb().
 */
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '.env.e2e.local'), override: true });

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:3001';

let passed = 0;
let failed = 0;
const failures = [];
const cleanups = [];

/**
 * Privacy (Bitácora N2/S5): failure details never print user text. Any `body` or `preview`
 * string is replaced by its length.
 */
function redact(value) {
  return JSON.stringify(value, (key, v) =>
    (key === 'body' || key === 'preview') && typeof v === 'string' ? `<${v.length} chars>` : v
  );
}

function check(label, condition, detail) {
  if (condition) {
    passed++;
    console.log(`  ✅  ${label}`);
  } else {
    failed++;
    failures.push(label);
    console.log(`  ❌  ${label}${detail !== undefined ? `\n      → ${redact(detail)}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${'─'.repeat(70)}\n  ${title}\n${'─'.repeat(70)}`);
}

/** Refuses to run against a non-local host unless explicitly allowed. */
function guardTarget() {
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(BASE_URL);
  if (!local && process.env.E2E_ALLOW_REMOTE !== '1') {
    console.error(`Refusing to run against ${BASE_URL}. Set E2E_ALLOW_REMOTE=1 after approval.`);
    process.exit(2);
  }
}

/**
 * Bitácora diary keys of the test users (SPEC v1.11 §3.5): token → the key header. Once a token's
 * diary is open, every call with that token sends `X-Bitacora-Key` unless `headers` says otherwise
 * (pass `{ 'x-bitacora-key': undefined }` to send none). Keys are never printed.
 */
const diaryKeys = new Map();

/** HTTP call that never throws on 4xx/5xx: returns { status, body }. */
async function http(method, urlPath, { token, body, rawBody, headers = {}, timeoutMs = 30000 } = {}) {
  const merged = {
    accept: 'application/json',
    ...(body !== undefined || rawBody !== undefined ? { 'content-type': 'application/json' } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(token && diaryKeys.has(token) ? { 'x-bitacora-key': diaryKeys.get(token) } : {}),
    ...headers,
  };
  for (const name of Object.keys(merged)) if (merged[name] === undefined) delete merged[name];
  const res = await fetch(`${BASE_URL}${urlPath}`, {
    method,
    headers: merged,
    body: rawBody !== undefined ? rawBody : body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(timeoutMs),
  });
  const text = await res.text();
  let parsed;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = text;
  }
  return { status: res.status, body: parsed };
}

/** Logs in through the auth module; returns the JWT. */
async function login(username, password) {
  const r = await http('POST', '/api/users/login', { body: { username, password } });
  if (r.status >= 300 || !r.body?.token) throw new Error(`Login failed for ${username}: ${r.status}`);
  return r.body.token;
}

/** The test passphrase of the E2E users: invented, never a real one (N3). */
const E2E_PASSPHRASE = process.env.E2E_DIARY_PASSPHRASE || 'e2e invented passphrase — not a real one';

/** Unpadded base64url, as the API expects keys and salts. */
const toBase64url = (bytes) => bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

/**
 * The key the app derives from a passphrase (SPEC v1.11 §4.6): PBKDF2-HMAC-SHA-256 over the NFC,
 * UTF-8 passphrase, with the account's salt and rounds, 32 bytes, as unpadded base64url.
 */
function deriveKey(passphrase, saltB64url, iterations) {
  const crypto = require('crypto');
  const salt = Buffer.from(saltB64url.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
  return toBase64url(crypto.pbkdf2Sync(Buffer.from(passphrase.normalize('NFC'), 'utf8'), salt, iterations, 32, 'sha256'));
}

/**
 * Opens a test user's diary like the app: `GET /key`; no key yet → a new salt and `POST /key`.
 * Afterwards every call with `token` carries the key header. Returns the key header.
 */
async function openDiary(token, passphrase = E2E_PASSPHRASE) {
  const crypto = require('crypto');
  const found = await http('GET', '/api/bitacora/key', { token });
  let key;
  if (found.status === 404) {
    const salt = toBase64url(crypto.randomBytes(16));
    key = deriveKey(passphrase, salt, 600000);
    const created = await http('POST', '/api/bitacora/key', {
      token,
      body: { iterations: 600000, salt },
      headers: { 'x-bitacora-key': key },
    });
    if (created.status !== 201) throw new Error(`Creating the test diary key failed: ${created.status}`);
  } else if (found.status === 200) {
    key = deriveKey(passphrase, found.body.data.salt, found.body.data.iterations);
  } else {
    throw new Error(`GET /key failed: ${found.status}`);
  }
  diaryKeys.set(token, key);
  return key;
}

/** Numeric userId carried by a JWT (payload only; the signature is the server's business). */
function tokenUserId(token) {
  return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString()).userId;
}

/** Runs fn(query) on a mysql connection to the database named by env var `dbEnvVar`. */
async function withDb(dbEnvVar, fn) {
  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: process.env.MYHOST,
    port: Number(process.env.MYPORT),
    user: process.env.MYUSER,
    password: process.env.MYPASSWORD,
    database: process.env[dbEnvVar],
    charset: 'utf8mb4',
  });
  const query = (sql, params = []) =>
    new Promise((resolve, reject) => connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));
  try {
    return await fn(query);
  } finally {
    connection.end();
  }
}

/** Register cleanup as soon as something is created; runs in reverse order at the end. */
function onCleanup(fn) {
  cleanups.push(fn);
}

function printSummary() {
  console.log(`\n${'═'.repeat(70)}\n  RESULT: ${passed} passed | ${failed} failed`);
  failures.forEach((f) => console.log(`   · ${f}`));
  console.log('═'.repeat(70));
  process.exitCode = failed > 0 ? 1 : 0;
}

/** Entry point: guard → main → cleanups (always) → summary. */
async function run(main) {
  guardTarget();
  try {
    await main();
  } catch (err) {
    failed++;
    failures.push(`Unhandled: ${err.message}`);
    console.error(`Unhandled: ${err.message}`);
  } finally {
    for (const fn of cleanups.reverse()) {
      try {
        await fn();
      } catch (err) {
        console.error(`Cleanup failed: ${err.message}`);
      }
    }
    printSummary();
  }
}

module.exports = {
  BASE_URL,
  check,
  section,
  http,
  login,
  tokenUserId,
  withDb,
  onCleanup,
  run,
  redact,
  openDiary,
  deriveKey,
  toBase64url,
  E2E_PASSPHRASE,
};
