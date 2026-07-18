# ADR-0006: Soft-delete for `series`, hard-delete for `finan`

**Status**: Accepted (retrospective — the two behaviors already existed in source; documented as a deliberate difference, not accidental drift, in `docs/ACCEPTANCE_CRITERIA.md` #4, verified 2026-07-14/15)

## Context

`DELETE /api/series/:id` and `DELETE /api/finan/delete/:id` share a verb and a route shape, which invites the assumption that they mean the same thing. They don't: `series-write.mysql.ts`'s `delete()` runs `UPDATE productions SET visible = 0` — the row (and its image) stays forever. `finan.mysql.ts`'s `delete()` runs a real `DELETE FROM movements_<user> WHERE id = ?` — the row is actually gone.

## Decision

Keep the two modules' delete semantics different, on purpose: a catalog entry (an anime/manga series) is worth preserving even when hidden from the public site — it might be re-shown later, and other data (ranking history, past user engagement) implicitly references it by id. A financial movement a user asked to delete should actually be gone — there's no equivalent reason to keep a "hidden" financial transaction around, and a user deleting a mistaken entry reasonably expects it to be really gone, not just invisible.

## Consequences

- `series`' soft-delete means disposable test/smoke fixtures accumulate as invisible rows forever — `docs/specification-roadmap.md` Phase 4e names this directly as "one real, permanent limitation": the HTTP API exposes no hard-delete endpoint for series, so `scripts/smoke-test.js`'s fixtures are never truly removed from `productions`, only hidden (`visible = 0`). Acceptable for a local/disposable DB; worth knowing before running the smoke test repeatedly against production.
- `series`' soft-delete interacts with the upsert-by-name+year behavior (`docs/ACCEPTANCE_CRITERIA.md` #5): before a 2026-07-18 fix (`docs/ACCEPTANCE_CRITERIA.md` #21), creating a series with the same name+year as a soft-deleted one silently "revived" it, since the duplicate check didn't filter on `visible`. This is exactly the kind of cross-cutting surprise a soft-delete policy has to keep accounting for at every write path that might collide with a hidden row — a hard-delete policy (like `finan`'s) doesn't have this failure mode, because there's no hidden row left to collide with.
- `finan`'s hard-delete means there is no undo, no audit trail, and no way to recover a mistakenly-deleted movement — accepted as the right tradeoff for financial data a user explicitly asked to remove.
- Any new module needs its own explicit answer to this question rather than copying whichever of the two happens to be closer in shape — "should a delete be recoverable" is a data-lifecycle decision each module's data deserves on its own terms, not a codebase-wide default.

## Alternatives considered

**Make both modules consistent** (either both soft-delete or both hard-delete). Never adopted, and `docs/ACCEPTANCE_CRITERIA.md` #4 states directly that a rewrite unifying the two "would be behaviorally wrong for one of the two modules" — the difference is the point, not an inconsistency to smooth over.
