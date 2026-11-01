# Bitácora Day 0 — API side

**Date:** 2026-10-31 · **Branch:** step 1 via PR #1 (merged → `main` `8173776`); steps 2–3 on `feature/20261031-bitacora-day0-t3` · **Released in:** —
**Implements:** `module-docs/apps/bitacora/SPEC.md` v1.0 — D1, §3 (C2–C13), §4 (reads/writes)
**Change ID:** `20261031-bitacora-day0` (also `module-data` PR #1 and `bitacora-react`)

## Summary
Step 1 done and merged (PR #1, `8173776`, CI green): the shared token middleware now also exposes the numeric `userId` from the JWT.
Step 2 (hardening of step 1) and step 3 (the `bitacora` module, T3) done on
`feature/20261031-bitacora-day0-t3`, unit + integration tests green at 100% coverage.
Next: the contract E2E against a real database (T4).

## Context
Bitácora reuses the `auth` module (SPEC D8; playbook E.1): same users, same login, same 30-day
JWT. Its data must be keyed by the immutable `userId`, not the username (SPEC §5.1 constraints
1–2: no UNIQUE index on `username`, casing trap already hit by `finan`).

## Step 1 — `validate-token.ts` exposes `userId` (D1)
**File:** `src/infrastructure/services/validate-token.ts`
- **Critical constraint:** `jwt-token-generator.service.ts` signs `{ userId, username, role }`, but
  the middleware only copied `username` into `req.body`.
- **Change (additive):** when `decoded.userId` is a number, also set `req.body.userId`. Nothing
  else changes: `username` handling, 401/500 paths and every other module behave as before. A token
  without a numeric `userId` still passes (other modules don't need it); Bitácora's use-cases will
  reject a missing `userId` with 401 themselves.
- **Global component rule (playbook §3):** done as its own step with its own tests, before any
  Bitácora code uses it.

## Step 2 — `validate-token.ts` drops a client-sent `userId` (bug found in step 1)
- **Bug:** step 1 only *set* `req.body.userId` when the token had a numeric one. With a token
  without it, a `userId` sent by the client in the JSON body survived the middleware, so a
  module keyed by `userId` could be told to act as another user (breaks N1). Every token issued
  today carries `userId`, so it was not exploitable in practice, but the isolation must not depend
  on that.
- **Fix:** otherwise `delete req.body.userId`. The value can only come from the verified token.
- Tests: +2 cases (client value dropped; client value overridden). Commit `3348143`.

## Step 3 — the `bitacora` module (T3)
Details and rules: `docs/modules/bitacora.md`. Summary:
- `src/modules/bitacora/` with the hexagonal layout of `finan` (domain → ports → one use case per
  endpoint → MySQL repository → controller → composition root). 9 endpoints, C2–C13.
- Use cases return `{ success, status, message, data?, errors? }` (D2); the controller only maps
  it to the D3 envelope. Missing/non-numeric `userId` → 401 in every use case (D1).
- **Critical constraints found in the code:**
  - `executeSafeQuery` e-mails and logs the failing SQL text → could leak entry text (N2). The
    repository uses `executeQuery`/`runInTransaction`; the controller logs only `error.message`.
  - The pool has no `dateStrings` → `DATE`/`DATETIME` would be shifted through the server's zone.
    All dates/timestamps are formatted in SQL.
  - `express.json()` defaults to 100 kB → a 100,000-char entry (A6) or an import batch would
    fail with 413→500. `bitacoraJsonParser` (10 MB) is mounted on `/api/bitacora` before the
    global parser in `server.ts` (only that path is affected).
- `MYDATABASEBITACORA` env var; docker mount + init map for `animecre_bitacora`.

### Interpretations of the spec (to confirm in module-docs)
1. **PUT with a numeric `baseVersion` when the date has no entry** (it was deleted on another
   device): the spec's rule "stored version ≠ baseVersion → 409" has no stored entry to return.
   Implemented as **create (201)** — the text being typed is kept; the deleted one stays in the
   trash. Nothing is lost.
2. **`deletedAt` and `purgeOn`** are UTC ISO timestamps (`2026-11-30T22:15:00Z`), not bare dates,
   so the front can compute "N days left" exactly.
3. **Nearby year** is judged by the anchor date (entry date − offset), not `YEAR(entry_date)`:
   for 2026-01-02, an entry on 2025-12-31 is "this year" and is excluded; 2019-12-30 is 6 years
   ago, not 7. The filter is done in code; SQL only selects the month/day pairs.
4. **Restore "keep both"** stores the current text, a blank line, then the deleted text (mirrors
   §2.3: "the other version, a blank line, then the local text"). The combined text is not
   re-checked against 100,000 chars.
5. **Concurrent first saves** of the same date: the loser's `ER_DUP_ENTRY`/`ER_LOCK_DEADLOCK`
   becomes a 409 with the winner's entry.
6. **Import:** `entries` must have 1–1,000 items; a date repeated inside one request is an invalid
   item (400, nothing written).

## Verification
- Step 1 unit: `test/infrastructure/lib/validateToken.test.ts` — 2 new cases (numeric `userId` set;
  non-numeric `userId` ignored) + the existing "no userId" case now asserts it stays undefined.
  Full suite then: 86 suites / 1,302 tests, coverage 100%, 2026-10-31.
- Steps 2–3 (2026-11-01): **92 suites / 1,470 tests passed, coverage 100%** (statements,
  branches, functions, lines); `tsc --noEmit` clean. New tests:
  - `test/modules/bitacora/domain/services/` — date rules (A8, D5/H3, H4 window, M2, purgeOn) and
    input rules (A5–A7 incl. emoji = 1 char, L1–L2).
  - `test/modules/bitacora/application/use-cases/bitacora.use-cases.test.ts` — 401/400 on every
    use case, H1–H4, A1–A5, A9, T1–T5 at use-case level, M1–M2, import.
  - `test/modules/bitacora/infrastructure/persistence/bitacora.mysql.test.ts` — SQL shape: user
    filter, `FOR UPDATE`, version compare, race → conflict, lazy purge, 30-day window, restore
    policies, import skip/overwrite.
  - `test/integration/bitacora.integration.test.ts` — real router + middleware: S1 (401 on all 9
    routes, no token and bad token), body `userId` ignored, S4 route ordering, envelope, 500
    without entry text in logs (N2).
  - `test/server.test.ts` — 100k-char `ñ` body parsed under `/api/bitacora` only.
- **Not yet run against a real database** — that is T4.

## Files created / modified
| File | Change |
|---|---|
| `src/infrastructure/services/validate-token.ts` | Sets `req.body.userId` when numeric (step 1); removes a client-sent one otherwise (step 2) |
| `test/infrastructure/lib/validateToken.test.ts` | +4 cases, 1 assertion added |
| `src/modules/bitacora/**` | New module (18 files) |
| `src/server.ts` | Mounts `bitacoraJsonParser` and the bitacora router |
| `src/infrastructure/services/swagger.ts` | Adds the bitacora paths |
| `test/modules/bitacora/**`, `test/integration/bitacora.integration.test.ts`, `test/server.test.ts` | Tests above |
| `docker/docker-compose.yml`, `docker/sql/00-run-nested-init-scripts.sh` | Mount and init `animecre_bitacora` |
| `docs/modules/bitacora.md` | New |
| `docs/databases.md`, `docs/architecture.md`, `docs/setup.md`, `README.md` | `animecre_bitacora` / `MYDATABASEBITACORA` |
| `docs/changes/20261031-bitacora-day0.md` | This doc |

## Pending (same branch, same change ID)
- [ ] `.env` (local) and production env: add `MYDATABASEBITACORA=animecre_bitacora` — done by the
      owner (env files are not edited by the assistant).
- [ ] Local DB: recreate the Docker volume (or run `bitacora-data/sql/db-structure.sql`) so
      `animecre_bitacora` exists.
- [ ] T4 `scripts/20261031-e2e-bitacora.js` from SPEC §6 (API rows), 2 local test users; negative
      controls A3, S2, S4 (§6.9).
- [ ] module-docs: confirm interpretations 1–6 above in the spec (patch version + change-log row).

## Version history
| Date | Version | Change |
|---|---|---|
| 2026-10-31 | v1 | Step 1: `userId` exposed by the token middleware |
| 2026-10-31 | v1.1 | PR #1 CI green (type-check + tests), squash-merged to main (8173776) at the owner's request |
| 2026-11-01 | v1.2 | Step 2: client-sent `userId` dropped by the middleware (`3348143`) |
| 2026-11-01 | v1.3 | Step 3 (T3): `bitacora` module, tests at 100%, docs, docker; 6 spec interpretations recorded |
