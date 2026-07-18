# Architecture Decision Records

Each ADR here documents one significant architectural decision actually made during this project's life — what was decided, why, what alternatives were considered (where a real alternative was on the table), and what it costs. Most of these are **retrospective**: written by reconstructing the decision from the code, commit history, and the day-by-day record in `docs/specification-roadmap.md`, not transcribed from a meeting that happened at the time. Where a decision was made explicitly, in conversation, with the user, the ADR says so and points at the exact date/phase in the roadmap.

**Format**: Context → Decision → Consequences → Alternatives considered (when a real one existed). Status is always `Accepted` unless noted otherwise — nothing here has been superseded yet.

**Relationship to the other docs**: an ADR answers *why is it built this way*. `docs/architecture.md` answers *what is the shape today*. `docs/SPECIFICATION.md` answers *how must new code be shaped to match*. `docs/ACCEPTANCE_CRITERIA.md` answers *what must the system do, observably*. Four different questions, deliberately not merged into one file — same reasoning as the roadmap/catalog split (see `docs/specification-roadmap.md`, the entry explaining why that split happened).

## Index

| # | Title | Status |
|---|---|---|
| [0001](0001-hexagonal-clean-architecture.md) | Hexagonal + Clean Architecture layering, all modules | Accepted |
| [0002](0002-cqrs-series-only.md) | CQRS for `series` only; classic use-cases for `auth`/`finan` | Accepted |
| [0003](0003-manual-composition-root.md) | Manual composition roots, no DI framework | Accepted |
| [0004](0004-database-per-module.md) | One MySQL database per module; schema owned by separate sibling repos | Accepted |
| [0005](0005-finan-per-user-tables.md) | Per-user dynamic tables for finan movements, not one shared table | Accepted |
| [0006](0006-soft-vs-hard-delete.md) | Soft-delete for `series`, hard-delete for `finan` | Accepted |
| [0007](0007-smoke-test-single-file.md) | `scripts/smoke-test.js` stays one plain script, not a test-framework project | Accepted (reverted once, see the ADR) |
| [0008](0008-full-coverage-ci-gate.md) | 100% test coverage as a hard CI gate | Accepted |

## Deferred (not yet a real decision)

**Contract testing between modules (e.g. Pact) if/when a microservice split happens.** `docs/specification-roadmap.md` Phase 4 raised this as something to revisit *if* `auth`/`finan`/`series` are ever actually split into separate deployables — they aren't; all three still run in one process behind one `server.ts`. Writing an ADR for a split that hasn't happened would be documenting a decision nobody has made. Revisit this the day a real split is proposed, not before.
