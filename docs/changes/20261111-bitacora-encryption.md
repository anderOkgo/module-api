# Bitácora: the diary encrypted at rest with a key only the user holds

**Date:** 2026-11-11 · **Branch:** `feature/20261111-bitacora-encryption` · **Released:** production, 2026-11-11 (deployed from the branch, then merged)
**Implements:** `module-docs/apps/bitacora/SPEC.md` v1.11 — §3.5 (C15–C17, key header), §4.6 (encryption,
search in the API), §4.7 step 2 (migration script), N2/N8/N10, §6.12 (K1–K9 on the API side), D32
**Change ID:** `20261111-bitacora-encryption` (also `module-data` PR #8 and `bitacora-react`)

## Summary
Every entry body is stored AES-256-GCM encrypted. The device derives a key from the passphrase and
sends it in `X-Bitacora-Key` on each request; the API opens the user's data key with it, encrypts and
decrypts in memory, and stores no key it can use alone. C2–C14 keep their shape. Search moves from SQL
`LIKE` into the API. Three new routes manage the key: `GET/POST/PUT /api/bitacora/key`.

## What this repo implements
| Spec item | Where | Status |
|---|---|---|
| §3.5 key header on C2–C14: 401 → 428 `KEY_NOT_SET` / `KEY_REQUIRED` → 403 `KEY_WRONG` | `controllers/bitacora.controller.ts` (`diary()`), `OpenDiaryUseCase` | ✅ |
| C16 `GET /key`, C15 `POST /key`, C17 `PUT /key` | `application/use-cases/diary-key.use-cases.ts`, `config/bitacora.module.ts` | ✅ |
| §4.6 envelope: DEK wrapped by the KEK, `v1:` format, AAD `<userId>:<date>` / `user_keys:<userId>` | `infrastructure/crypto/aes-gcm.ts` | ✅ |
| §4.6 every body read decrypted, every write encrypted; trash preview and "keep both" on plain text | `infrastructure/persistence/bitacora.mysql.ts` | ✅ |
| §4.6 search in the API: every day of the user, decrypted, folded (NFD, lower case), all terms | `termMatcher` in `domain/services/entry-rules.ts`; `searchEntries` | ✅ |
| `user_keys` access | `infrastructure/persistence/user-keys.mysql.ts` | ✅ |
| Swagger: key header + 403/428 on every diary route; the `/key` routes | `documentation/bitacora.swagger.ts` | ✅ |
| §4.7 step 2 migration script | `scripts/20261111-encrypt-bitacora.js` | ✅ rehearsed on a scratch DB |
| E2E: existing scripts with the key header + new K cases | `scripts/_e2e-helpers.js` (`openDiary`), `scripts/20261111-e2e-bitacora-encryption.js` | ✅ local |

## Constraints found
- **One pool per `Database` instance** (`src/infrastructure/data/mysql/database.ts`: the constructor calls
  `mysql.createPool`). The module now builds one `Database` and gives it to both repositories.
- **The rows move between `entries` and `entries_trash` by `INSERT … SELECT`.** The ciphertext is copied as
  is; since its AAD is user + date, and a move never changes either, it still decrypts. So delete and
  restore-without-conflict need no decrypt at all.
- **`LIKE` and `LEFT()` on ciphertext are meaningless**: search and the trash preview now work on decrypted
  text in the repository. The SQL of C7 (month) and `hasEntry` never read a body.
- **Error messages carry no text**: `UndecryptableBodyError` says only "An entry body cannot be decrypted";
  the controller logs `error.message` only, never headers (N2).
- **The front must derive the key exactly like the script**: PBKDF2-HMAC-SHA-256, the passphrase normalized
  to Unicode NFC and encoded as UTF-8, the stored 16-byte salt, the stored rounds, 32 bytes out, sent as
  unpadded base64url. Recorded for `bitacora-react`; worth a spec clarification (§4.6).

## Decisions
- The cipher travels as an explicit argument (`execute(…, cipher)` → repository method), not hidden state:
  each request has its own data key, and a forgotten argument is a type error.
- `OpenDiaryUseCase` runs in the controller before the use case, so a diary use case never runs without a
  cipher, and a refusal touches no entry table (checked in integration: zero repository calls).
- A body that does not decrypt is a 500 (data corrupted or moved by hand), not a 4xx: the user did nothing
  wrong, and the message stays generic.
- Base64url is implemented by hand (`key-rules.ts`) and rejects non-canonical strings, so the code does not
  depend on Node's `base64url` encoding (the production Node version was not checked).
- The migration script loads the compiled API code (`dist/`), so it encrypts with exactly the code that will
  read the data; it refuses a non-local `MYHOST`.

## Verification (local, 2026-11-11)
- Unit + integration: **1,625 tests, 99 suites, 100 % statements / branches / functions / lines**
  (`npx jest --coverage`). New: `aes-gcm.test.ts`, `key-rules.test.ts`, `diary-key.use-cases.test.ts`,
  `user-keys.mysql.test.ts`; integration K1 (428 on every diary route, with and without a key row), K4 (403,
  zero repository calls), K2/K6 on `/key`, K5 (500 without text). One full run with coverage showed 1
  failed test that did not reproduce in three later runs; its name was not captured (not investigated).
- E2E against the local API built from this branch, server output captured as `E2E_SERVER_LOG`:
  `scripts/20261111-e2e-bitacora-encryption.js` **60/60** (K1 incl. the CORS preflight for
  `x-bitacora-key`, K2–K7, K9 on the output and the server log); `scripts/20261031-e2e-bitacora.js`
  **106/106** and `scripts/20261108-e2e-bitacora-search.js` **38/38**, both now opening the test users'
  diaries with `openDiary` (`_e2e-helpers.js`). A7's "identical bytes in the database" became "stored
  encrypted, none of the text bytes in the database": its old form failed, as it should, on ciphertext.
- Negative control (§6.9): a build whose `OpenDiaryUseCase` accepts a wrong key (served a zero key
  instead of 403) → the encryption E2E **45 passed, 14 failed**: every K4 403 check, the "database
  unchanged" check, K6's "old key → 403" and K7's "A's token with B's key → 403". Rebuilt afterwards.
- Search timing (K8/N8, synthetic data the size of the owner's diary: 2,700 days, 1.57 MB stored): decrypt
  + match + snippets **~45–52 ms median, < 70 ms max** on the development machine, against N8's 500 ms.
  Production will add the transfer of ~1.6 MB from MySQL; Q8 is timed after deploy.
- Migration script, on a scratch database with invented fixtures (accents, emoji, a 10,000-char body, one
  trash row) and an invented passphrase — **13/13**: refuses another user's rows, mismatched or short
  passphrases, a missing `--user`, a non-local `MYHOST`, and a second run, writing nothing each time;
  encrypts and commits; output holds no text or passphrase; every body `v1:`; `version` and `modified`
  unchanged; the key opens with a PBKDF2 derivation done independently of the script; every body decrypts
  to its original; another passphrase does not open the key. Database dropped afterwards.

## Release and rollback (E.4: data → API → front)
Part of the one sitting of SPEC §4.7: `module-data` `0002` first, this API (build, `npm run bup`, manual
Restart in cPanel), then `bitacora-react`, then the local → production copy. Between the API deploy and the
copy, production answers 428 `KEY_NOT_SET`: nobody uses the app in that window.
Rollback: redeploy the previous `dist/` (and restore §4.7 step 1's dump if the copy was already made).

## Post-deploy checklist
- [x] `/health` UP after the owner's Restart (uptime 0.7 s, production); every diary route and `/key`
  answer 401 without a token; the CORS preflight from `bitacora.animecream.com` allows `x-bitacora-key`.
- [x] After the copy (§4.7 step 5): the owner opened the app on the phone with the passphrase; it works.
- [ ] Q8 timed (< 500 ms): not timed; the owner found search working on the phone.
- [ ] K12 restore test with the passphrase from the password manager:
  `scripts/20261111-verify-bitacora-restore.js --user 3 --database restore_test_bitacora` (the production
  dump of 2026-11-11 15:30 is restored there). The script was tested on a scratch DB (right passphrase 3/3,
  wrong passphrase refused, also against the restored backup). **Pending: the owner runs it.**

## Release log (2026-11-11, SPEC §4.7, one sitting)
1. The owner restored production into local (13:48 dump) and rehearsed: the migration script with the real
   passphrase in their own terminal — 2,734 entries, 2,734 verified, 0 plain left; the local app opened
   with it and looked the same.
2. A new production backup (15:17) was identical to the 13:48 dump apart from its date line: production
   had not changed. Kept as `D:\Bitacora-import\backups\prod-2026-11-11-1348-before-encryption.sql`.
3. API: `npm run bup` from the branch. The first upload's output was cut (exit 255); a second
   `com\db-sync-FTP-both.bat` said "Nothing to synchronize", so every file had arrived. The owner restarted.
4. Data: `module-data` steps of `db-copy-local-to-remote.bat` one at a time; the swap checked before upload
   (2,734 rows of user 3, all `v1:`, one `user_keys` row, empty trash), re-synced ("Nothing to
   synchronize"), restored; a new production dump then showed the same counts and the same key row.
5. Front: `bitacora-react` `npm run bup`; production serves the new hashed bundle.
6. The owner opened the diary on the phone with the passphrase.

## Version history
| Date | Change |
|---|---|
| 2026-11-11 | Created: API side implemented and verified locally (unit, integration, E2E 60 + 106 + 38, negative control) |
| 2026-11-11 | Released to production (release log above); restore-check script added; K12 pending the owner |
