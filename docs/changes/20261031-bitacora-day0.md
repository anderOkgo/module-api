# Bitácora Day 0 — API side

**Date:** 2026-10-31 · **Branch:** step 1 via PR #1 (merged → `main` `8173776`); next steps on a new branch from main · **Released in:** —
**Implements:** `module-docs/apps/bitacora/SPEC.md` v1.0 — D1 (this step); §3 and §4 in the next steps
**Change ID:** `20261031-bitacora-day0` (also `module-data` PR #1 and `bitacora-react`)

## Summary
Step 1 done and merged (PR #1, `8173776`, CI green): the shared token middleware now also exposes the numeric `userId` from the JWT.
Next steps on this branch: the `bitacora` module (T3), its contract E2E (T4).

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

## Verification
- Unit: `test/infrastructure/lib/validateToken.test.ts` — 2 new cases (numeric `userId` set;
  non-numeric `userId` ignored) + the existing "no userId" case now asserts it stays undefined.
- Full suite: **86 suites / 1,302 tests passed, coverage 100%** (statements, branches, functions,
  lines), 2026-10-31. `tsc --noEmit` clean.

## Files created / modified
| File | Change |
|---|---|
| `src/infrastructure/services/validate-token.ts` | Also sets `req.body.userId` when numeric |
| `test/infrastructure/lib/validateToken.test.ts` | +2 cases, 1 assertion added |
| `docs/changes/20261031-bitacora-day0.md` | This doc |

## Pending (new branch from main, same change ID)
- [ ] T3 `src/modules/bitacora/` (SPEC §3 C2–C13, §4), `MYDATABASEBITACORA`, docker mount of
      `module-data/schemas/bitacora-data`, docs (modules, databases, architecture).
- [ ] T4 `scripts/20261031-e2e-bitacora.js` from SPEC §6 (API rows), 2 local test users.

## Version history
| Date | Version | Change |
|---|---|---|
| 2026-10-31 | v1 | Step 1: `userId` exposed by the token middleware |
| 2026-10-31 | v1.1 | PR #1 CI green (type-check + tests), squash-merged to main (8173776) at the owner's request |
