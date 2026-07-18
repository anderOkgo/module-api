# ADR-0004: One MySQL database per module; schema owned by separate sibling repos

**Status**: Accepted (retrospective; the multi-repo schema layout was discovered, not designed, during this project — see `docs/specification-roadmap.md` Phase 4b, 2026-07-14)

## Context

`auth`, `finan`, and `series` each need persistent storage, and each is a genuinely separate domain (accounts/auth, personal finance, an anime catalog) with no shared tables and no cross-module foreign keys. Discovered while building the E2E suite (Phase 4b): the schema for each database is deliberately **not** version-controlled inside `module-api` at all — it lives in three sibling repositories (`animecream-data`, `auth-data`, `finan-data`), each following its own `sql/db-structure.sql` (bootstrap) / `sql/db-views-procs.sql` + `sql/db-trigger.sql` (idempotent, re-run every deploy) / `sql/migrations/000N_*.sql` (incremental, append-only, never edited after commit) convention, deployed via each repo's own `db-deploy-schema.bat` pipeline (see `docs/specification-roadmap.md` Phase 5b for the full deploy mechanics).

## Decision

Three independent `Database` instances (`src/infrastructure/data/mysql/database.ts`), one per module, each pointed at its own database via its own env var (`MYDATABASEANIME`/`MYDATABASEAUTH`/`MYDATABASEFINAN` → `animecre_cake514`/`animecre_auth`/`animecre_finan`). No cross-database joins anywhere in the codebase, no shared connection pool. Schema ownership stays outside this repo, in the three sibling repos described above.

## Consequences

- Each module's data model can evolve independently — a `finan` migration never touches `series`' schema, and vice versa, by construction (they're not even in the same database).
- `docker-compose.yml` has to mount all three sibling repos' `sql/` directories to bootstrap a local environment from scratch — this mount was silently broken for 9 months (MariaDB's entrypoint doesn't recurse into subdirectories) before being found and fixed (Phase 4c, 2026-07-14); the long-running local `animecream-mariadb` container's persistent volume is what actually carried the schema in the meantime, not the init-script mount.
- **A complete regeneration of this system is a four-repo effort, not a one-repo effort.** `module-api` alone cannot fully specify the system — `docs/SPECIFICATION.md` §9 states this explicitly so a from-scratch rewrite doesn't assume this repo is the whole story.
- Production deployment is a separate, manual, per-repo pipeline (`db-deploy-schema.bat`) with no shared orchestration across all three — a schema change touching more than one database's business logic (there's never been one, since the three domains don't overlap) would need three separate deploy runs, not one.

## Alternatives considered

**One shared database with per-module schemas/prefixes.** Never adopted — the three domains have no relational overlap, so nothing would be gained from co-locating them beyond fewer connection configs, at the cost of coupling three independently-evolving schemas to one physical database's migration history.

**Move all three sibling repos' schema into `module-api` itself**, once the multi-repo split was discovered. Explicitly considered and rejected in the moment (Phase 4b's progress-log entry) — would have created a second, divergent schema source rather than consolidating anything, since the sibling repos remain the real source of truth for production deploys regardless of what `module-api` contains.
