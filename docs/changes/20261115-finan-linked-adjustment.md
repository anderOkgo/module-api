# The linked adjustment follows deletes and edits

**Date:** 2026-11-15 · **Branch:** `feature/20261115-finan-linked-adjustment` · **Released in:** https://info.animecream.com, 2026-11-15 (PR #17, `npm run bup`, restarted by the owner)
**Implements:** `module-docs/apps/finan/SPEC.md` v0.10 — round "the linked adjustment follows deletes and edits" (L.2 rules, L.3 contract, L.6 J1–J10, J13)
**Change ID:** `20261115-finan-linked-adjustment` (the same in `finan-react` for the restore, L.5)

## Summary
A movement with an origin (`operate_for`, stored as `log`) adds to or takes from that balance, which stands for a
real bank account. Until now only the create did it. Now:
- **Delete** gives the movement's effect back to its origin.
- **Edit** undoes the old effect on the old origin and applies the new one on the new origin (value, type and origin
  can all change).
- **Every write is one transaction** with its adjustments. Before, create adjusted the origin and then inserted, as
  two separate queries: a failed insert left the balance changed (M3).
- A new origin that does not exist on an edit → 400 "Linked movement not found", nothing written (as create). An
  old origin that no longer exists is skipped (edit, delete).

## Contract
| # | Endpoint | Change |
|---|---|---|
| C2 | `POST /api/finan/insert` | Same answers; adjustment and insert are atomic |
| C3 | `PUT /api/finan/update/:id` | Re-adjusts the origin(s); new 400 "Linked movement not found" |
| C4 | `DELETE /api/finan/delete/:id` | Gives the effect back to the origin; same answers |

Swagger: `operate_for` in `swagger.schemas.ts` describes it.

## Implementation
- `application/ports/finan.repository.ts`: `create`, `update`, `delete` and `operateForLinkedMovement` leave the port;
  `runInTransaction(work)` hands `work` a `FinanTransaction` (`create`, `update`, `delete`, `adjustValue`).
- `application/use-cases/linked-adjustment.ts` (new): `effectOn(type, value)` (+ income, − expense or balance, 0
  otherwise), `originOf(log)`, `applyTo` (throws `LINKED_NOT_FOUND`), `undoOn` (skips a missing origin). A stored
  value read back as text (`'50.00'`) is a number here.
- Use cases: put (apply, then insert), update (undo old, apply new, then update), delete (undo, then delete), each
  inside `runInTransaction`.
- `finan.mysql.ts`: `runInTransaction` over `Database.runInTransaction` (one connection, queries that throw, so any
  failure rolls back); `adjustValue` locks the origin with `SELECT … FOR UPDATE`, then `value = value + ?` in SQL
  (before: read in JS, add, write the result).
- `scripts/smoke-test.js`: after deleting its linked-adjustment fixture, it checks that the base is back to 100.
  It still writes only its own fixtures; it is human-triggered, as before.

## Verification
- Unit + integration: **1,691 tests, 100% statements, branches, functions and lines** (`npx jest --coverage`). New:
  `linked-adjustment.test.ts`; put (J1, J10 rollback, M1 signs, M4), update (J4–J8, a missing old origin, a text
  value, a NULL origin), delete (J2, J3, J9), `adjustValue` in MySQL (lock, SQL delta, missing origin, zero delta,
  error). One run also failed `create-series-complete.command.test.ts` "unique timestamps", the known flaky test
  (`module-docs/STATUS.md`), not touched here; the next full run passed.
- **Black-box E2E** `scripts/20261115-e2e-finan-linked-adjustment.js` against the local API built from this branch
  and the local Docker database, with the dedicated test user A: **21/21** — J1, J4, J5, J6, J7, J8 (400, and the
  undo already done rolled back: origin and movement unchanged), J2, J3, J9. Fixtures deleted.
- Jest E2E `test/e2e/finan.e2e.test.ts`: 8/8 on the same database.
- **Negative control J13:** the same build with the undo on delete removed (compiled use case): J2 and J3 fail
  (19 passed, 2 failed). Rebuilt clean afterwards.

## Release and rollback
module-api first (`npm run bup`, the owner restarts in cPanel), then finan-react (the restore sends the origin; with
the old API a restored movement would adjust its origin once more after a delete that did not undo it). Rollback:
revert both PRs and deploy, API first. No data change; deletes and edits made before the release are not corrected
(spec D10).

## Post-deploy checklist
- The owner, on a test balance: an expense with that origin, then delete it → the balance is back; restore it from
  Deleted → taken again.

## Version history
| Date | Change |
|---|---|
| 2026-11-15 | Created; unit 100% (1,691), E2E 21/21 local, Jest E2E 8/8, negative control recorded |
| 2026-11-15 | **Merged** (PR #17, `2c99dd6`): unit 1,691 at 100% on `main`. **Deployed:** `npm run bup`, a second sync said "Nothing to synchronize", the owner restarted in cPanel; `/health` UP (uptime under 1 s at the check), the served Swagger holds the new `operate_for` text. Then finan-react #15. Production writes were left to the owner's own check |
