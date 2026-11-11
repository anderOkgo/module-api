/* eslint-disable */
/**
 * One-time encryption of an existing Bitácora diary (module-docs/apps/bitacora/SPEC.md v1.11 §4.7
 * step 2, D32; change 20261111-bitacora-encryption).
 *
 * RUN IT YOURSELF, IN YOUR OWN TERMINAL, AGAINST THE LOCAL DATABASE ONLY:
 *
 *     npm run build
 *     node scripts/20261111-encrypt-bitacora.js --user <your user id>
 *
 * It asks for the passphrase twice with hidden input. The passphrase is never stored, printed or
 * sent anywhere; do not paste it into a chat and do not pass it as an argument.
 *
 * What it does, in ONE transaction (all or nothing):
 *   1. refuses unless MYHOST is localhost / 127.0.0.1, the `user_keys` table exists, the user has no
 *      key yet, no body is already encrypted, and no other user has rows (their passphrase is theirs);
 *   2. derives the key exactly as the app does (PBKDF2-SHA256, 600,000 rounds, a new 16-byte salt,
 *      passphrase in Unicode NFC), creates the user's `user_keys` row with a new data key;
 *   3. encrypts every body of the user in `entries` and `entries_trash` with the API's own code
 *      (dist/, so `npm run build` first);
 *   4. reads every row back, opens the stored key with the passphrase again, decrypts each body and
 *      compares its SHA-256 with the original; any difference, or any body left in clear → ROLLBACK.
 *
 * It prints counts only, never a body, a key or the passphrase (N2). Paste its output if you want
 * it reviewed.
 *
 * Testing only: when stdin is not a terminal, the two passphrase lines are read from stdin.
 */
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DIST = path.join(__dirname, '..', 'dist', 'modules', 'bitacora');
const KDF = 'PBKDF2-SHA256';
const ITERATIONS = 600000;
const MIN_PASSPHRASE = 16;

function fail(message) {
  console.error(`\n✋ ${message}\nNothing was written.`);
  process.exit(1);
}

function argUser() {
  const at = process.argv.indexOf('--user');
  const id = at === -1 ? NaN : Number(process.argv[at + 1]);
  if (!Number.isInteger(id) || id <= 0) fail('Usage: node scripts/20261111-encrypt-bitacora.js --user <your user id>');
  return id;
}

/** Two passphrase entries: hidden prompts in a terminal, two stdin lines otherwise (tests). */
async function readPassphrases() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    const [first = '', second = ''] = Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
    return [first, second];
  }
  const ask = (prompt) =>
    new Promise((resolve) => {
      const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
      process.stdout.write(prompt);
      rl._writeToOutput = () => {}; // hide what is typed
      rl.question('', (answer) => {
        rl.close();
        process.stdout.write('\n');
        resolve(answer);
      });
    });
  return [await ask('Passphrase: '), await ask('Repeat it:  ')];
}

const sha256 = (text) => crypto.createHash('sha256').update(text, 'utf8').digest('hex');
const toBase64url = (bytes) => bytes.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function main() {
  const userId = argUser();
  if (!/^(localhost|127\.0\.0\.1|::1)$/.test(process.env.MYHOST || '')) {
    fail('MYHOST is not a local database. This script only runs against the local copy (SPEC §4.7 step 2).');
  }

  let crypt;
  try {
    crypt = require(path.join(DIST, 'infrastructure', 'crypto', 'aes-gcm.js'));
  } catch {
    fail('dist/ not found or outdated: run `npm run build` first.');
  }

  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: process.env.MYHOST,
    port: Number(process.env.MYPORT),
    user: process.env.MYUSER,
    password: process.env.MYPASSWORD,
    database: process.env.MYDATABASEBITACORA,
    charset: 'utf8mb4',
  });
  const query = (sql, params = []) =>
    new Promise((resolve, reject) => connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

  try {
    // 1. Preconditions, before asking for anything.
    const tables = await query("SHOW TABLES LIKE 'user_keys'");
    if (tables.length === 0) fail('Table user_keys is missing: apply module-data migration 0002 to this database first.');
    const others = await query(
      `SELECT (SELECT COUNT(*) FROM entries WHERE user_id <> ?) + (SELECT COUNT(*) FROM entries_trash WHERE user_id <> ?) AS n`,
      [userId, userId]
    );
    if (Number(others[0].n) > 0) fail(`${others[0].n} rows belong to other users. Each user encrypts with their own passphrase.`);
    const keyRows = await query('SELECT 1 FROM user_keys WHERE user_id = ?', [userId]);
    if (keyRows.length > 0) fail('This user already has a diary key: the diary is already encrypted.');
    const sealedAlready = await query(
      `SELECT (SELECT COUNT(*) FROM entries WHERE body LIKE 'v1:%') + (SELECT COUNT(*) FROM entries_trash WHERE body LIKE 'v1:%') AS n`
    );
    if (Number(sealedAlready[0].n) > 0) fail(`${sealedAlready[0].n} bodies already look encrypted. Start again from a fresh copy.`);
    const counts = await query(
      `SELECT (SELECT COUNT(*) FROM entries WHERE user_id = ?) AS entries, (SELECT COUNT(*) FROM entries_trash WHERE user_id = ?) AS trash`,
      [userId, userId]
    );
    console.log(`Database ${process.env.MYDATABASEBITACORA} on ${process.env.MYHOST}: ${counts[0].entries} entries, ${counts[0].trash} in the trash for user ${userId}.`);

    // 2. The key, derived as the app derives it.
    const [passphrase, repeated] = await readPassphrases();
    if (passphrase !== repeated) fail('The two passphrases differ.');
    const normalized = passphrase.normalize('NFC');
    if ([...normalized].length < MIN_PASSPHRASE) fail(`The passphrase must have at least ${MIN_PASSPHRASE} characters (P47).`);
    const salt = crypto.randomBytes(16);
    console.log('Deriving the key…');
    const kek = crypto.pbkdf2Sync(Buffer.from(normalized, 'utf8'), salt, ITERATIONS, 32, 'sha256');
    const dek = crypt.aesGcmDiaryKeyCrypto.generateDek();
    const wrappedDek = crypt.aesGcmDiaryKeyCrypto.wrapDek(userId, kek, dek);
    const cipher = crypt.aesGcmDiaryKeyCrypto.cipherFor(userId, dek);

    // 3 + 4. One transaction: key row, every body encrypted, everything verified, then commit.
    await query('START TRANSACTION');
    try {
      await query(
        `INSERT INTO user_keys (user_id, kdf, kdf_iterations, kdf_salt, wrapped_dek, created, modified)
         VALUES (?, ?, ?, ?, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
        [userId, KDF, ITERATIONS, toBase64url(salt), wrappedDek]
      );

      const originals = new Map();
      for (const table of ['entries', 'entries_trash']) {
        const rows = await query(
          `SELECT id, DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM ${table} WHERE user_id = ? FOR UPDATE`,
          [userId]
        );
        for (const row of rows) {
          originals.set(`${table}:${row.id}`, sha256(row.body));
          // `modified` and `version` stay as they are: the text did not change, only how it is stored.
          await query(`UPDATE ${table} SET body = ?, modified = modified WHERE id = ? AND user_id = ?`, [
            cipher.encrypt(row.date, row.body),
            row.id,
            userId,
          ]);
        }
      }

      // Verify through the stored key, opened again from the passphrase, as the API will.
      const stored = await query('SELECT wrapped_dek AS wrappedDek FROM user_keys WHERE user_id = ?', [userId]);
      const reopened = crypt.aesGcmDiaryKeyCrypto.unwrapDek(userId, kek, stored[0].wrappedDek);
      if (!reopened) throw new Error('the stored key does not open with the passphrase');
      const check = crypt.aesGcmDiaryKeyCrypto.cipherFor(userId, reopened);
      let verified = 0;
      for (const table of ['entries', 'entries_trash']) {
        const rows = await query(
          `SELECT id, DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM ${table} WHERE user_id = ?`,
          [userId]
        );
        for (const row of rows) {
          if (sha256(check.decrypt(row.date, row.body)) !== originals.get(`${table}:${row.id}`)) {
            throw new Error(`a body in ${table} does not match its original after decrypting`);
          }
          verified++;
        }
      }
      const plain = await query(
        `SELECT (SELECT COUNT(*) FROM entries WHERE body NOT LIKE 'v1:%') + (SELECT COUNT(*) FROM entries_trash WHERE body NOT LIKE 'v1:%') AS n`
      );
      if (Number(plain[0].n) !== 0 || verified !== originals.size) {
        throw new Error(`${plain[0].n} bodies still in clear, ${verified} of ${originals.size} verified`);
      }

      await query('COMMIT');
      console.log(
        `\n✅ ${counts[0].entries} entries, ${counts[0].trash} in the trash, ${verified} verified (SHA-256 identical), 0 plain left. Committed.`
      );
      console.log('Next (SPEC §4.7): open the local app with the passphrase and check Today, a past day, Month and a search.');
    } catch (error) {
      await query('ROLLBACK');
      fail(`Rolled back: ${error.message}`);
    }
  } finally {
    connection.end();
  }
}

main().catch((error) => fail(`Unexpected error: ${error.message}`));
