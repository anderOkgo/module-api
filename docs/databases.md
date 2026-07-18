# Databases

Three MySQL/MariaDB databases, one per module — there is no fourth database and no shared `categories` table (an older version of this doc claimed both; neither exists). Full column-level schema lives in three sibling repos outside this one — see `docs/specification-roadmap.md`'s "multi-repo system" note. This file lists what's actually in each, verified against those repos' `sql/db-structure.sql`/`db-views-procs.sql`.

## `animecre_cake514` — series module (`MYDATABASEANIME`)

**Tables**: `productions`, `demographics`, `genres`, `titles` (alternative titles), `productions_genres` (many-to-many).

**Views**: `view_all_info_produtions`, `view_all_years_productions`, plus several ranking/stats views (`v_series_count_by_year`, `v_avg_top10_by_decade`, `v_avg_qualification_top10_selected_years`, `v_top250_animes_by_decade`, `v_avg_top10_by_year`).

**Procedure**: `update_rank()` — re-ranks and re-normalizes every row's `qualification` after each write. This is not a simple recalculation; see `docs/ACCEPTANCE_CRITERIA.md` #1 for why a client's submitted value is never stored verbatim.

## `animecre_auth` — auth module (`MYDATABASEAUTH`)

**Tables**: `users`, `email_verification`.

No views or stored procedures — all logic here is in application code (`src/modules/auth/`), not the database.

## `animecre_finan` — finan module (`MYDATABASEFINAN`)

**Tables**: `type_sources` (the real movement-category catalog — 9 rows; the app's `MovementType` enum only recognizes 3, see `docs/ACCEPTANCE_CRITERIA.md` #6), `constants` (per-currency budget-formula overrides, see #9), and **one `movements_<username>` table per user**, created on demand by `proc_create_movements_table` — there is no single shared `movements` table.

**Procedures**: `proc_create_movements_table`, `proc_view_total_expense_day`, `proc_view_movements`, `proc_view_monthly_movements_order_by_tag`, `proc_view_total_balance`, `proc_view_yearly_expenses_incomes`, `proc_view_monthly_expenses_incomes_order_row`, `proc_monthly_expenses_until_day`, `proc_view_balance_until_date`.

**Views**: `view_monthly_expenses_incomes`, `view_monthly_expenses_incomes_order_row`, `view_general_info`, `view_final_trip_info` — the last two are hardcoded to one specific real account and tagging convention, not general features (`docs/ACCEPTANCE_CRITERIA.md` #7–#8).

These 9 procedures used to build dynamic SQL by string-concatenating parameters into the query text — a real SQL-injection surface, fixed by switching to `EXECUTE ... USING` bound parameters (`docs/specification-roadmap.md` Phase 5).

## Connecting

`src/infrastructure/data/mysql/database.ts`'s `Database` class takes the module's env var name as its constructor argument — one pooled connection per module, not a single shared pool:

```typescript
new Database('MYDATABASEANIME')   // → series
new Database('MYDATABASEAUTH')    // → auth
new Database('MYDATABASEFINAN')   // → finan
```

See `docs/setup.md` for the real `.env` variable names, and `docker/README.md` for running these locally in Docker.

---

**Last verified against source**: 2026-07-18
