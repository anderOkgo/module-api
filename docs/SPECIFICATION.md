# Design Specification

**What this is**: the *generative* rules — how to shape new code so it belongs in this codebase, not a description of what already exists. `docs/architecture.md` is descriptive ("here is the current layout"); `docs/ACCEPTANCE_CRITERIA.md` is behavioral ("here is what the system must do, observable over HTTP"); this file is the remaining piece — the conventions an implementer (human or AI) must follow so that a from-scratch regeneration, or a new module bolted onto this one, *feels like* it was written by the same hand, not just passes the same tests.

Every rule below was extracted by reading the actual code across all three modules and checking where they agree — not designed on a whiteboard. Where the three modules disagree with each other, that's recorded honestly in "Known deviations" at the end, rather than papered over. A rule stated here without a "known deviation" note has been verified to hold across `auth`, `finan`, and `series` as of 2026-07-18.

## 1. Layering — dependency direction is one-way

```
infrastructure → application → domain
```

`domain/` may import nothing from this module except other `domain/` files. `application/` may import `domain/`, never `infrastructure/`. `infrastructure/` may import both. This is checked here by construction (grep for cross-module-boundary imports), not by a lint rule — **there is no automated enforcement of this today**, only convention plus this document.

**Verified 2026-07-18**: zero violations in `auth` or `series`. One found and fixed in `finan`: `application/ports/finan.repository.ts` imported `DataParams` from `infrastructure/models/dataparams.ts` — a real layering violation, though inert (the import was unused, so it had zero runtime effect; removed as part of writing this document).

## 2. Module shape: `domain/` / `application/` / `infrastructure/`, always these three

Every module (`src/modules/{auth,finan,series}/`) has exactly these three top-level directories, no others:

- **`domain/entities/`** — plain TypeScript `interface`s (never classes, never anything with methods). One file per aggregate (`{module}.entity.ts` or, for series, one file covering the whole aggregate family: `Series`, `SeriesCreateRequest`, `SeriesUpdateRequest`, `SeriesResponse`, plus its related `Genre`/`Title`/`Demographic`). A module may have more than one entity file if it has genuinely distinct aggregates (`auth` has `user.entity.ts` *and* `login.entity.ts`; `finan` has `movement.entity.ts` *and* `movement-request.entity.ts`).
- **`domain/ports/`** — interfaces for adapters that are *not* the module's own repository (password hashing, token generation, email sending, image processing). **Only exists if the module needs one.** `finan` has no `domain/ports/` at all, because it needs nothing beyond its own repository — that's a correct, deliberate absence, not a gap.
- **`application/ports/`** — the module's own repository interface(s) (`{module}.repository.ts`, or `series-read.repository.ts`/`series-write.repository.ts` for the one CQRS module). This is the one port every module has.
- **`application/use-cases/`** *or* **`application/commands/` + `application/queries/` + `application/handlers/`** — see §3.
- **`infrastructure/persistence/`** — the repository port's concrete MySQL implementation(s).
- **`infrastructure/controllers/`** — one controller class per module, all its routes as arrow-function class properties (so they're already bound when passed to Express — no `.bind(this)` anywhere in route wiring).
- **`infrastructure/config/{module}.module.ts`** — the composition root, see §4.
- **`infrastructure/documentation/{module}.swagger.ts`** — hand-written OpenAPI fragment, aggregated centrally by `src/infrastructure/services/swagger.ts`.
- **`infrastructure/services/`** — adapters for the module's `domain/ports/` interfaces. Only exists alongside a non-empty `domain/ports/`.
- **`infrastructure/validation/`** — request-shape validation functions, see §6.

**Known deviation**: `finan` has an `infrastructure/models/dataparams.ts` holding a single `DataParams` interface — this is a request-shape DTO that belongs in `domain/entities/` by the pattern every other DTO in this codebase follows, not in a directory unique to this one module. Left as-is (a rename/move is safe but out of scope for this document); flagged here so a regenerator doesn't copy the `infrastructure/models/` directory name as if it were a real convention.

## 3. Two business-logic shapes coexist — by deliberate module-level choice, not migration debt

`series` uses full CQRS: `application/commands/*.command.ts` (plain data, extends `Command`), `application/queries/*.query.ts` (plain data, extends `Query`), one handler class per command/query in `application/handlers/{commands,queries}/`, each implementing `CommandHandler<TCommand, TResult>` or `QueryHandler<TQuery, TResult>` (`src/modules/series/application/common/{command,query}.interface.ts`) with a single `execute()` method.

`auth` and `finan` use classic use-cases instead: one class per operation in `application/use-cases/`, also with a single `execute()` method, but no `Command`/`Query` base type and no read/write repository split.

**When to use which**: CQRS earns its extra ceremony (18 files for 16 operations, in series' case) when a module has enough operations that a read/write repository split and a formal command/query taxonomy pay for themselves — `series` has 9 write operations and 7 read operations against one large, relationally-connected aggregate (genres, titles, demographics). `auth` (3 operations) and `finan` (4 operations) don't have enough surface area to justify it; a plain use-case per operation is the right amount of structure for their shape. **This is not an unfinished migration** — `auth`/`finan` are not "CQRS modules that haven't been converted yet." A new module should default to the use-case shape and only adopt CQRS if it turns out to need the read/write split for a reason as concrete as series' (a single controller injected with 16+ handlers, a genuinely separate read-optimized view of the data).

## 4. Composition root: `build{Module}Module()`

Every module exports exactly one function, `infrastructure/config/{module}.module.ts`, with this exact shape:

```ts
export function build{Module}Module() {
  // 1. infrastructure adapters (concrete classes: repository, and any domain/ports adapters)
  // 2. application layer (use-cases, or handlers wired to the adapters from step 1)
  // 3. controller, injecting the application layer from step 2
  // 4. Router(), wiring each route to a controller method, with middleware
  //    (validateToken/validateAdmin/uploadMiddleware) as needed
  return { router, /* every constructed instance, for tests to reach into */ };
}
```

No DI container, no framework — every dependency is a manual constructor argument. The return object always includes `router` plus every instance built along the way (controller, repositories, use-cases/handlers) — this is what lets `test/integration/`'s `buildTestApp()` mock a repository by reaching into the returned object before the routes are exercised, without needing a separate test-only wiring path.

`src/server.ts`'s `buildApp()` calls all three `build{Module}Module()` functions and mounts each router under its own path prefix (`/api/series`, `/api/users`, `/api/finan`) — this is the only place that knows all three modules exist simultaneously.

## 5. Ports: two placements, by what they're for

- A **repository port** (the module's own persistence contract) always lives in `application/ports/{module}.repository.ts` (or `{module}-{read,write}.repository.ts` for series), is an `interface`, and is implemented exactly once, by a `infrastructure/persistence/{module}.mysql.ts` class.
- Any **other external-system port** (hashing, tokens, email, image processing) lives in `domain/ports/{name}.port.ts`, is an `interface`, and is implemented by an `infrastructure/services/{name}.service.ts` class.

Why the split (`application/ports` vs `domain/ports`) rather than one `ports/` directory: a repository port is inherently tied to *this module's own data shape* (its methods take and return this module's entities) — it belongs at the application layer, next to the code that orchestrates it. A hashing/token/email/image port has no knowledge of any module-specific entity at all — it's a general capability the domain depends on, so it sits at the domain layer. A new port should be placed by asking "does this interface's method signatures mention this module's own entities?" — if yes, `application/ports/`; if no, `domain/ports/`.

**Repository methods never throw for "not found"** — they return `null` (single-entity lookups) or `[]`/`{errorSys: true}` shapes from the shared `Database.executeSafeQuery()` helper (see `docs/architecture.md`'s "Multi-database configuration"), and the calling use-case/handler decides whether "not found" is an error worth throwing. Repository methods **do** throw (or reject) for genuine infrastructure failures (a real DB error, `result.errorSys` on a write) — callers are expected to let those propagate, not swallow them at the repository layer.

## 6. Validation: two passes, two different jobs, never merged into one

**Pass 1 — request-shape validation**, in `infrastructure/validation/{module}.validation.ts`: pure functions, no DB calls, no business rules — only "is this the right type, right length, right format." Returns a result object (`{valid, errors}` in series, `{error, errors}` in finan/auth's use-case-return-shape) rather than throwing, and runs at the controller, *before* the use-case/handler is ever called. This layer answers "is the request well-formed."

**Pass 2 — business-rule validation**, inside the use-case/handler's own `validate()`/`validateInput()` method (and, in series, a further `validateRelations()`/existence-check step that *does* call the repository — e.g. "does this `demography_id` actually exist"). This layer answers "is this well-formed request actually allowed to happen." It throws (series) or returns the same `{error, message}` envelope as the rest of that use-case (auth/finan) — see §7 for why those two are different.

A new operation needs both passes if it takes user input: shape-check at the controller boundary (fast-fail before touching a use-case at all, and shared across a whole request-body shape rather than duplicated per business rule), and a rule-check inside the handler (catches things Pass 1 structurally can't, like foreign-key existence or cross-field consistency). Skipping Pass 1 and doing everything in Pass 2 (or vice versa) is how `finan`'s `updateMovement`/`deleteMovement` ended up with no `id`-validation at all for a while (fixed — see `docs/ACCEPTANCE_CRITERIA.md`'s catalog for the recovery-sweep history in `docs/specification-roadmap.md` Phase 2.6).

## 7. Error propagation — two incompatible conventions coexist; do not mix them within one module

This is the sharpest fork in the codebase, and the one most likely to be silently "fixed into consistency" by a rewrite in a way that changes observable HTTP behavior:

- **`series`' CQRS handlers throw** a plain `Error(message)` for both validation failures and "not found." The controller wraps every handler call in `try { ... } catch (error) { res.status(4xx/5xx).json({...}) }`, translating `error.message` into the response body itself.
- **`auth`/`finan`'s use-cases never throw** for expected failures — `execute()` wraps its entire body in its own internal `try/catch` and always *resolves* with a `{error: boolean, message?, data?}` (auth) or `{success: boolean, message, data?}` (finan) envelope. The controller checks that field and picks the status code; its own `try/catch` around `execute()` is effectively unreachable for these use-cases today (`execute()` never rejects), kept only as a defensive backstop.

**A new module must pick one of these two conventions for its own use-cases/handlers and use it consistently across every operation in that module** — mixing "sometimes throw, sometimes return an error envelope" *within* one module/use-case is the one thing to avoid; it's what makes a caller unable to write one uniform error-handling path.

**Known deviation, not a rule to copy**: the HTTP response *envelope shape itself* is not uniform even within a single module. `series.controller.ts` alone uses at least four different JSON shapes for an error response across its 16 methods (`{success:false, message}`; `{error:true, message}`; `{success:false, error:'...', message}`; a bare validation-errors object with neither `success` nor `error`). `finan.controller.ts` returns `{message, data}` on success (no `success`/`error` field at all) but `{error:true, message}` on failure. `auth`'s `user.controller.ts` just forwards whatever shape the use-case itself returned. **This is real, verified-in-source inconsistency, not a simplification** — `scripts/smoke-test.js` and any HTTP client asserting on response shape today has to know the exact shape per endpoint, not one shape per module or one shape system-wide. Documented here rather than fixed, because unifying it would change every endpoint's wire contract at once — exactly the kind of decision that needs the user's sign-off before touching, per this project's standing "flag behavior changes, don't silently make them" rule (see `docs/specification-roadmap.md`'s Phase 5 constraint and the recurring "asked the user" pattern throughout the Progress log). A new endpoint added to an existing module should match *that module's* prevailing shape for its own new methods, not invent a fifth one.

## 8. Entities are data, not behavior

Every `domain/entities/*.entity.ts` file is `interface`s only — never a `class`, never a method, never a constructor that enforces an invariant. All validation and normalization (trimming, defaulting, range-checking) happens procedurally in a handler/use-case's `validate()`/`normalize()` methods (§6), not on the entity type. A `SeriesCreateRequest` cannot enforce "name must be ≥2 characters" at the type level — nothing in this codebase tries to. This is a deliberate simplicity choice (no invariant-enforcing value objects, no rich domain model) — a regeneration that introduced behavior-bearing entity classes would be adding a pattern this codebase doesn't have anywhere, not "completing" one.

Request/response DTOs (`SeriesCreateRequest`, `SeriesResponse`, `LoginResponse`, `CreateMovementRequest`, etc.) live in the *same file* as their core entity, not in a separate `dto/` directory — there is no `dto/` directory anywhere in this codebase.

## 9. Multi-database and multi-repo boundaries

Three independent MySQL databases, one per module, each opened via its own `new Database('MYDATABASE{ANIME,AUTH,FINAN}')` instance (`src/infrastructure/data/mysql/database.ts`) — no cross-database joins anywhere, and no shared connection pool between modules. A new module needing its own storage gets its own `Database` instance and its own env-var-configured connection, following this same naming convention (`MYDATABASE<NAME>`).

The schema for all three databases is deliberately **not** in this repo — it lives in three sibling repos (`animecream-data`, `auth-data`, `finan-data`), each following its own `sql/db-structure.sql` (bootstrap) / `sql/db-views-procs.sql` + `sql/db-trigger.sql` (idempotent, re-run every deploy) / `sql/migrations/000N_*.sql` (incremental, append-only) convention — see `docs/specification-roadmap.md`'s "multi-repo system" note and `docs/databases.md`. **A complete regeneration of this system is a four-repo effort, not a one-repo effort** — this repo alone cannot fully specify the system, and this document only covers `module-api`'s own conventions.

## 10. Testing conventions (the mechanism that keeps all of the above true)

- **100% statement/branch/function/line coverage**, CI-gated (`jest.config.js`'s `coverageThreshold`, `.github/workflows/ci.yml`) — not a soft target, a hard merge gate.
- **A branch that's structurally unreachable gets deleted, not defended with a test that contradicts its own caller.** Three examples from `docs/specification-roadmap.md` Phase 2.5 (`put-movement.use-case.ts`, `get-initial-load.use-case.ts`, `image.ts`) — in each case, the *only* call site already guaranteed the condition the code re-checked, so the dead branch was removed rather than papered over with an artificial test.
- **A new file with zero coverable statements attributed to it by Istanbul is not automatically "fine"** — `docs/specification-roadmap.md` Phase 4a found 15 of 16 series handlers and 3 persistence classes silently had *zero real tests*, hidden behind exactly this artifact, until the integration suite exercised them unmocked for the first time. Check real coverage (a file genuinely exercised by an unmocked test), not just the aggregate percentage.
- **Four layers, each answering a different question, not four attempts at the same thing** — unit (imports this codebase's TS directly, mocked dependencies) → integration (real Express app, only repositories mocked) → E2E (same app, real database, opt-in) → `scripts/smoke-test.js` (zero `src/` imports, pure HTTP against an already-running instance — the one portable, implementation-agnostic layer). Full reasoning in `docs/specification-roadmap.md` Phase 7.
- **Every new non-obvious business rule discovered goes into `docs/ACCEPTANCE_CRITERIA.md`**, and into `scripts/smoke-test.js` when it's safe to automate with a disposable fixture (not when it needs real personal/production data — several catalog entries are deliberately documented-only for exactly that reason).

## Known deviations (tracked here so a regeneration doesn't copy them as if they were intentional)

| Deviation | Where | Disposition |
|---|---|---|
| `application/ports/finan.repository.ts` imported from `infrastructure/` | `finan` | **Fixed** while writing this document (2026-07-18) — the import was unused, zero behavior change. |
| A request DTO lives in `infrastructure/models/` instead of `domain/entities/` | `finan`'s `DataParams` | Left as-is — a safe rename/move, but out of scope here. |
| HTTP error-response envelope shape is not uniform, not even within one module | `series` (≥4 shapes), `finan` (success has no `success`/`error` field at all) | Documented in §7, not fixed — would change every endpoint's wire contract, needs an explicit decision first. |
| Two incompatible error-propagation conventions (throw vs. return-envelope) | series (CQRS) vs. auth/finan (use-cases) | Not a bug — a consequence of §3's two coexisting shapes. Documented in §7 so it's a recognized split, not mistaken for accidental drift. |

---

**Companion documents**: `docs/architecture.md` (descriptive structure), `docs/ACCEPTANCE_CRITERIA.md` (behavioral contract), `docs/specification-roadmap.md` (how and why any of this changed, day by day).

**Last verified against source**: 2026-07-18
