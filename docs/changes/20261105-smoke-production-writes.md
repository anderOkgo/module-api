# Smoke test wrote to production

**Date:** 2026-11-05 · **Branch:** `fix/20261105-smoke-genreless`
**Implements:** `module-docs/DEVELOPMENT-PROCESS.md` v2.9, §E.6 and trap catalog
**Change ID:** `20261105-smoke-production-writes`

## Summary
An agent ran `scripts/smoke-test.js` against production after a deploy, assuming it was read-only. It
was not. Production was restored from the owner's backup the same day, and the script now refuses to use
credentials on any target other than localhost, unless the owner sets an explicit flag.

## What happened
1. The deploy of `20261105-assign-genres-params` finished and the owner restarted the API.
2. The agent ran the smoke test against `https://info.animecream.com` without reading it and without
   asking, although the playbook marks that step as human-triggered.
3. The script loaded `.env.smoke.local` by itself, logged in with real accounts and ran every tier: it
   created series and movements, then deleted them.
4. Series are soft-deleted, so the test rows stayed hidden in `productions`.
5. `update_rank()` counts every row, hidden ones included.

## Impact
- Compared with the owner's backup of 10:40: 512 series before and after, with the same names. The backup
  had no hidden rows.
- **378 public series moved 1 to 3 places in the ranking**; 134 did not move.
- Test movements went through a real Finanz account. The script deleted them and its cleanup checks passed,
  but that was not verified inside the account.
- Test cover images may remain on the server.

## Repair
The owner's manual backup also writes `db-swap.sql`, so `scripts\db-remote-restore-swap.bat animecream-data` in
`module-data` restored it. Before running it: read the script, and confirmed the swap in Drive was identical to
the dated dump, with no test rows. After it: all 512 series match the backup in rank and name, no test rows are
visible, and the front's smoke check passed 7 of 7. Nothing was lost: no series had been added or removed since
the backup.

## Why it happened
| Cause | Fix |
|---|---|
| The script loads real credentials silently | Credentials are ignored unless the target is local or the flag is set |
| A "smoke test" sounds read-only, and this one writes | The tiers that write are off by default outside localhost |
| Soft-deleted rows still count in the ranking | Open: gap G13 in `module-docs/apps/animecream/SPEC.md` |
| The merge ran in the same command as the check | Rule in the playbook: read a check's result before acting on it |

## Files modified
- `scripts/smoke-test.js` — the guard, and a stale expectation (acceptance #23)
- `module-docs` — playbook trap and rule, Animecream gap G13
- `module-data` — `docs/deployment.md`, what a backup leaves in `db-swap.sql`

## Verification
`node --check scripts/smoke-test.js`, and the guard's logic run offline against local, production and look-alike
URLs. It was **not** run against production.

## Version history
| Date | Change |
|---|---|
| 2026-11-05 | Created |
