# ADR-0002: CQRS for `series` only; classic use-cases for `auth`/`finan`

**Status**: Accepted (retrospective — `series`' CQRS handlers landed via commit `886ba5f`, "feat: implement series management command handlers...", 2026-06-07, per the root-cause table in `docs/specification-roadmap.md` Phase 0)

## Context

`series` has by far the largest surface area of the three modules: 16 operations (9 writes, 7 reads) against one large, relationally-connected aggregate (a production has genres, alternative titles, a demographic, and a rank/qualification computed across the *entire* catalog on every write — see `docs/ACCEPTANCE_CRITERIA.md` #1). `auth` has 3 operations; `finan` has 4. All three started out with the same shape (one controller, one repository, one method per operation calling straight into it).

## Decision

`series` alone was restructured into full CQRS: a write repository and a read repository (`SeriesWriteRepository`/`SeriesReadRepository`), a `Command`/`Query` DTO plus a dedicated handler class per operation (`application/commands/` + `application/queries/` + `application/handlers/{commands,queries}/`), each implementing a single `execute()` method against the `CommandHandler`/`QueryHandler` base interfaces. `auth` and `finan` were deliberately left as classic use-cases — one class per operation in `application/use-cases/`, no read/write repository split, no `Command`/`Query` taxonomy.

**This is not partial migration debt.** `auth`/`finan` are not "CQRS modules that haven't been converted yet" — see `docs/architecture.md`'s CQRS section and `docs/SPECIFICATION.md` §3, both explicit that this is a deliberate, permanent per-module choice.

## Consequences

- `series`' read/write split lets read-optimized SQL (the `view_all_info_produtions`/`view_all_years_productions` views, see `docs/ACCEPTANCE_CRITERIA.md` #23) live entirely on the read side, with zero risk of a write path accidentally depending on a view's join semantics.
- `series`' controller is injected with all 16 handlers directly (see `docs/modules/series.md`) — more constructor arguments than `auth`'s 3 or `finan`'s 4, but each handler is individually small and single-purpose, which is what let the Phase 4a coverage sweep (`docs/specification-roadmap.md`) write focused unit tests per operation without one handler's test file growing unbounded.
- A new module defaults to the use-case shape (fewer files, faster to write, adequate for a handful of operations). It earns CQRS only when it hits a `series`-shaped problem: enough operations that a formal read/write split and command/query taxonomy pay for their own ceremony. `docs/SPECIFICATION.md` §3 states this decision rule explicitly so a future module doesn't cargo-cult CQRS onto a 3-operation module, or cargo-cult use-cases onto something `series`-sized.

## Alternatives considered

**Migrate `auth`/`finan` to CQRS too, for consistency.** Rejected (implicitly, by never having happened) — 3 and 4 operations respectively don't have enough read/write asymmetry or aggregate complexity to justify the extra indirection; doing it anyway would be optimizing for the *appearance* of architectural uniformity over each module's actual shape.
