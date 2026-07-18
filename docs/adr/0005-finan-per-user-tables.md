# ADR-0005: Per-user dynamic tables for finan movements, not one shared table

**Status**: Accepted — explicitly confirmed with the user, 2026-07-15 (`docs/specification-roadmap.md` Phase 5 preamble: "User ruled out consolidating finan's per-user tables into one shared table")

## Context

Every finan user's movements live in their own dynamically-created table, `movements_<username>` (created on first use by `createTableForUser()`), rather than one shared `movements` table with a `user_id` foreign key — the conventional relational-database default. This came up for a real reason: a 2026-07-15 review of `finan-data/sql/db-views-procs.sql` found the 9 finan stored procedures built dynamic SQL by concatenating the per-user table name directly into the query text before `PREPARE`/`EXECUTE` — a real SQL-injection surface (see `docs/ACCEPTANCE_CRITERIA.md` #3's sibling note and `docs/specification-roadmap.md` Phase 5 item 2), since MySQL cannot parameterize an identifier (table name) the way it can a value. Consolidating to one shared table would have made that whole class of problem disappear along with the per-user-table architecture itself.

## Decision

The user considered consolidating to one shared table (with the SQL-injection fix as the trigger for asking) and explicitly chose to **keep** the per-user-table architecture. The SQL-injection surface was fixed a different way instead: bound parameters (`EXECUTE ... USING`) for every value, with only the table name itself staying dynamically built, now guarded by centralized username normalization (`docs/ACCEPTANCE_CRITERIA.md` #3) plus a DB-side `REGEXP '^[a-z0-9_]+$'` charset guard as defense in depth.

## Consequences

- Each user's financial data is physically isolated at the table level, not just logically isolated by a `WHERE user_id = ?` filter — a query bug that dropped a `WHERE` clause could never leak one user's movements into another's result set, because there is no query shape that reads across two users' tables at once. Verified as a real, executable guarantee (not just a design intention) via a dedicated E2E test (`test/e2e/finan.e2e.test.ts`, added Phase 5) that creates two users, inserts a movement each, and confirms zero cross-contamination.
- The cost is real and was named directly by the SQL-injection review: every one of the 9 stored procedures (and every method in `FinanMysqlRepository`, see `docs/ACCEPTANCE_CRITERIA.md` #3) has to independently get username-handling right, since there's no single `WHERE` clause a bug can hide behind — this is exactly what let the Phase 6 case-sensitivity bug (`movements_JuanPerez` vs. `movements_juanperez` being two different tables) exist for as long as it did, undetected, until a real user hit it in production.
- A schema-level query across all users at once (an admin report spanning every account, say) is not a single `SELECT` — it would need to enumerate tables and union them, something a shared-table design gets for free. No such feature exists today, so this cost hasn't been paid for real yet, but it's a real constraint on this design going forward.

## Alternatives considered

**Consolidate to one shared `movements` table with a `user_id` column.** Explicitly proposed and rejected by the user on 2026-07-15, in direct response to the SQL-injection review that would otherwise have made this the obvious fix. The per-user-table's data-isolation property was judged worth keeping despite the extra per-method discipline it demands.
