# System Architecture

Module-API implements **Clean Architecture**, **Hexagonal Architecture (Ports & Adapters)**, and **CQRS** (in the `series` module only) to keep business logic independent of frameworks, databases, and HTTP.

For per-module structure, endpoints, and business rules, see `docs/modules/auth.md`, `docs/modules/finan.md`, `docs/modules/series.md`. For the exhaustive, continuously-verified list of non-obvious business rules and the methodology behind them, see **`docs/ACCEPTANCE_CRITERIA.md`** — that document is the authoritative, actively-maintained record of this system's behavior; this file covers the durable architectural shape around it. For the *generative* rules — how new code must be shaped to belong here, including the places where the three modules deliberately (or not-so-deliberately) disagree with each other — see **`docs/SPECIFICATION.md`**. `docs/specification-roadmap.md` is the day-by-day project log — how and why things changed, not what's true today.

## Architectural principles

**Clean Architecture**: framework/UI/database independence, testability via interfaces.

**Hexagonal Architecture**: ports (interfaces) defined in `application`/`domain`, adapters (implementations) in `infrastructure`. Dependencies point inward — `infrastructure → application → domain`, never the reverse.

**CQRS**: only the `series` module uses it (9 commands, 7 queries, one handler each) — `auth` and `finan` use classic use-cases instead, a deliberate choice given their simpler read/write shape, not an unfinished migration.

## Layer structure

```
┌─────────────────────────────────────┐
│           Presentation               │  Controllers, Routes
├─────────────────────────────────────┤
│            Application               │  Use Cases / Commands, Queries, Handlers
├─────────────────────────────────────┤
│              Domain                   │  Entities, Ports
├─────────────────────────────────────┤
│          Infrastructure               │  Repositories, Database, external adapters
└─────────────────────────────────────┘
```

## Directory structure

```
src/
├── modules/
│   ├── auth/        # see docs/modules/auth.md
│   ├── finan/        # see docs/modules/finan.md
│   └── series/       # see docs/modules/series.md — the only CQRS module
│
├── infrastructure/                  # Global, cross-module infrastructure
│   ├── config/
│   │   └── env.ts                  # assertRequiredEnvVars() — fails fast at startup if SECRET_KEY is missing
│   ├── data/mysql/
│   │   ├── database.ts             # Database class: pooled connection, executeSafeQuery, runInTransaction
│   │   └── mysql.helper.ts
│   ├── services/
│   │   ├── cyfer.ts                # Encryption helper
│   │   ├── email.ts                # SMTP sending
│   │   ├── image.ts                # Sharp-based optimization (used by series)
│   │   ├── swagger.ts              # OpenAPI aggregation across modules
│   │   ├── swagger.schemas.ts
│   │   ├── upload.ts               # multer configuration
│   │   ├── validate-token.ts       # JWT verification middleware (any valid token)
│   │   └── validate-admin.ts       # JWT verification + role===ADMIN check
│   └── validation/generalValidation.ts
│
├── index.ts                        # Entry point: new Server()
└── server.ts                       # buildApp() (pure, testable) + Server (real bootstrap: DB connect, listen)
```

## Request flow

```
HTTP Request
  → CORS / JSON body parsing / compression
  → validateToken or validateAdmin (if the route requires it)
  → multer upload middleware (series image routes only)
  → Controller (extracts request data)
  → Use Case / Command|Query Handler (business rules, orchestration)
  → Repository (data access, write or read)
  → Database.executeSafeQuery() / runInTransaction()
  → MySQL
```

Errors: caught per-layer, falling through to `errorHandlerMiddleware` in `server.ts` if nothing else handles them (JSON parse errors → 400, everything else → 500). Unknown routes get a real JSON 404 (added when `server.ts` was refactored for testability — previously fell through to Express's default HTML 404).

## Core patterns

**Composition Root**: one `build{Module}Module()` function per module (`{module}.module.ts`) that constructs every adapter, injects them into use cases/handlers, builds the controller, and wires routes. No DI framework — manual constructor injection everywhere.

**Repository Pattern**: interface in `application/ports/` (or `domain/ports/` for non-persistence ports like image processing), implementation in `infrastructure/persistence/`. Repositories are pure data access — no business rules, no hashing, no token generation, no email sending (see "Design evolution" below for why that distinction matters here specifically).

**Use Case / Handler Pattern**: one class per business operation, `execute()` method, dependencies injected via constructor, independent of HTTP.

## Multi-database configuration

Three separate MySQL databases, one per module, each via its own `Database` instance:

```
MYDATABASEANIME  → animecre_cake514   (series)
MYDATABASEAUTH   → animecre_auth      (auth)
MYDATABASEFINAN  → animecre_finan     (finan)
```

The schema for all three lives outside this repo, in three sibling repos (`animecream-data`, `auth-data`, `finan-data`) — see `docs/specification-roadmap.md`'s "multi-repo system" note and `docs/databases.md`.

`Database` (`src/infrastructure/data/mysql/database.ts`): connection pooling, `executeSafeQuery()` (catches errors, emails admins, returns `{errorSys: true}` rather than throwing), and `runInTransaction()` (real `BEGIN`/`COMMIT`/`ROLLBACK` on a single pooled connection — added so `series`' `assignGenres` delete+insert pair, and the multi-step `create-series-complete`/`update-series` flows, are genuinely atomic).

## Security

- **JWT**: `validateToken` (any valid token) / `validateAdmin` (token + `role === ADMIN`) middleware, both reading `process.env.SECRET_KEY` directly — **no fallback**. `src/infrastructure/config/env.ts`'s `assertRequiredEnvVars()` crashes the process at startup if `SECRET_KEY` is unset, rather than ever signing/verifying with a guessable default. (Until 2026-07-18 this was three different hardcoded literals across signing vs. verification — see `docs/ACCEPTANCE_CRITERIA.md` #18.)
- **Passwords**: bcrypt, 10 salt rounds.
- **SQL**: parameterized queries via `executeSafeQuery(query, params)` throughout; the one place raw string interpolation is unavoidable (finan's per-user `movements_<username>` table name — MySQL can't parameterize identifiers) is guarded by centralized username normalization plus a DB-side `REGEXP` charset guard (see `docs/ACCEPTANCE_CRITERIA.md` #3, and Phase 5 in `docs/specification-roadmap.md` for the SQL-injection fix in the finan stored procedures themselves).
- **Account lockout**: see `docs/modules/auth.md`.

## Testing strategy

Four layers, each answering a different question — the reasoning behind this split (and why not every layer can serve as a portable "spec") is in `docs/specification-roadmap.md` Phase 7:

1. **Unit** (`test/modules/**`, `test/infrastructure/**`) — imports this codebase's TypeScript directly, mocks dependencies. 100% statement/branch/function/line coverage, gated in CI.
2. **Integration** (`test/integration/**`) — real Express app + real middleware/controllers/use-cases, only the repository classes mocked.
3. **E2E** (`test/e2e/**`) — same in-process app, but against the real, live database. Opt-in (`npm run test:e2e`), not part of the CI gate (needs a running MariaDB container).
4. **`scripts/smoke-test.js`** — the one layer with zero `src/` imports: plain HTTP requests to an already-running instance. This is the portable, implementation-agnostic contract — see `docs/ACCEPTANCE_CRITERIA.md`.

## Design evolution (historical)

Condensed from two now-superseded documents (`architecture-analysis.md`, `architecture-final-report.md`, both dated Oct 2025, merged into this file 2026-07-18):

Early on, `auth`/`finan`/`series` had real Clean Architecture violations: use cases imported `infrastructure` repository classes directly (with `new XMysqlRepository()` as an optional-constructor-arg default), and repositories contained business logic (email validation, verification-code generation, bcrypt hashing, JWT signing — all inside `user.mysql.ts`, not in a use case). A refactor (Oct 2025) introduced the current ports/adapters split — `PasswordHasherPort`/`TokenGeneratorPort`/`EmailServicePort` and their bcrypt/JWT/SMTP adapters — moved all business logic into use cases, and reduced repositories to pure CRUD + queries. That structure is what's described throughout this document; it has held up since. The ongoing hardening work (transactions, SQL-injection fixes, the SECRET_KEY fail-fast guard) is logged day-by-day in `docs/specification-roadmap.md`, and the business rules it surfaced live in `docs/ACCEPTANCE_CRITERIA.md` — neither is duplicated here, since both are updated continuously and this file isn't.

---

**Last verified against source**: 2026-07-18
