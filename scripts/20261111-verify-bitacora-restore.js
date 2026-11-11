/* eslint-disable */
/**
 * Restore test of the encrypted Bitácora diary (module-docs/apps/bitacora/SPEC.md v1.11 N11, §6.12 K12).
 * Proves that a backup can be read back with the passphrase alone: it opens the user's key from the
 * restored `user_keys` row and decrypts every body of `entries` and `entries_trash`.
 *
 * RUN IT YOURSELF, IN YOUR OWN TERMINAL, AGAINST A LOCAL DATABASE (a production dump restored into a
 * scratch database), typing the passphrase FROM YOUR PASSWORD MANAGER, not from memory or a device:
 *
 *     npm run build
 *     node scripts/20261111-verify-bitacora-restore.js --user <your user id> --database <scratch database>
 *
 * It writes nothing and prints counts only, never a text, a key or the passphrase (N2).
 */
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

function fail(message) {
  console.error(`\n✋ ${message}`);
  process.exit(1);
}

function arg(name) {
  const at = process.argv.indexOf(name);
  return at === -1 ? undefined : process.argv[at + 1];
}

async function readPassphrase() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    for await (const chunk of process.stdin) chunks.push(chunk);
    return Buffer.concat(chunks).toString('utf8').split(/\r?\n/)[0];
  }
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    process.stdout.write('Passphrase (from your password manager): ');
    rl._writeToOutput = () => {}; // hide what is typed
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
  });
}

async function main() {
  const userId = Number(arg('--user'));
  const database = arg('--database');
  if (!Number.isInteger(userId) || userId <= 0 || !database) {
    fail('Usage: node scripts/20261111-verify-bitacora-restore.js --user <id> --database <scratch database>');
  }
  if (!/^(localhost|127\.0\.0\.1|::1)$/.test(process.env.MYHOST || '')) fail('MYHOST is not a local database.');

  let crypt;
  try {
    crypt = require(path.join(__dirname, '..', 'dist', 'modules', 'bitacora', 'infrastructure', 'crypto', 'aes-gcm.js'));
  } catch {
    fail('dist/ not found: run `npm run build` first.');
  }

  const mysql = require('mysql');
  const connection = mysql.createConnection({
    host: process.env.MYHOST,
    port: Number(process.env.MYPORT),
    user: process.env.MYUSER,
    password: process.env.MYPASSWORD,
    database,
    charset: 'utf8mb4',
  });
  const query = (sql, params = []) =>
    new Promise((resolve, reject) => connection.query(sql, params, (err, rows) => (err ? reject(err) : resolve(rows))));

  try {
    const [key] = await query(
      'SELECT kdf_iterations AS iterations, kdf_salt AS salt, wrapped_dek AS wrappedDek FROM user_keys WHERE user_id = ?',
      [userId]
    );
    if (!key) fail(`No user_keys row for user ${userId} in ${database}.`);
    const counts = await query(
      'SELECT (SELECT COUNT(*) FROM entries WHERE user_id = ?) AS entries, (SELECT COUNT(*) FROM entries_trash WHERE user_id = ?) AS trash',
      [userId, userId]
    );
    console.log(`Database ${database}: ${counts[0].entries} entries, ${counts[0].trash} in the trash for user ${userId}.`);

    const passphrase = await readPassphrase();
    console.log('Deriving the key…');
    const salt = Buffer.from(key.salt.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
    const kek = crypto.pbkdf2Sync(Buffer.from(passphrase.normalize('NFC'), 'utf8'), salt, Number(key.iterations), 32, 'sha256');
    const dek = crypt.aesGcmDiaryKeyCrypto.unwrapDek(userId, kek, key.wrappedDek);
    if (!dek) fail('This passphrase does not open the key of this backup.');
    const cipher = crypt.aesGcmDiaryKeyCrypto.cipherFor(userId, dek);

    let opened = 0;
    let total = 0;
    for (const table of ['entries', 'entries_trash']) {
      const rows = await query(`SELECT DATE_FORMAT(entry_date, '%Y-%m-%d') AS date, body FROM ${table} WHERE user_id = ?`, [userId]);
      for (const row of rows) {
        total++;
        try {
          if (cipher.decrypt(row.date, row.body).length > 0) opened++;
        } catch {
          // counted as not opened
        }
      }
    }
    if (opened !== total) fail(`${opened} of ${total} bodies decrypted. The restore test FAILED.`);
    console.log(`\n✅ Restore test passed: the passphrase opens the key, and ${opened} of ${total} bodies decrypt.`);
  } finally {
    connection.end();
  }
}

main().catch((error) => fail(`Unexpected error: ${error.message}`));
