# One movement validator, with the type check on update

**Date:** 2026-11-05 · **Branch:** `fix/20261105-finan-small-gaps` · **Released in:** https://info.animecream.com, 2026-11-05
**Implements:** `module-docs/apps/finan/SPEC.md` v0.4, gaps G1, G2, G3, G4, G8, G9
**Change ID:** `20261105-finan-small-gaps`

## Summary
Creating and updating a movement share the same field checks, and updating now rejects a movement type that does not
exist, as creating already did.

## Notes
- The Finanz form sends 1, 2 or 8 as a number on both routes, so nothing changes for the app.
- The response of `/initial-load` still has `currentMonthExpenses`, although the front no longer reads it.

## Release and rollback
`npm run bup`, then the owner restarts the app in cPanel. Rollback: revert and deploy.

## Verification
Unit and E2E of the finan module pass. In production: the upload ends with nothing left to synchronize, and after the
owner restarted the app `GET /` answers 200. The update check was not tried there, since that would need a write.

## Version history
| Date | Change |
|---|---|
| 2026-11-05 | Created |
