# Module-API — Documentation Index

## Index

- [General Architecture](architecture.md)
- [Design Specification](SPECIFICATION.md) — generative rules for how new code should be shaped, not what already exists
- [Architecture Decision Records](adr/README.md) — why the big structural choices were made, with real alternatives and consequences
- [Project Setup](setup.md)
- [Docker (local MariaDB)](../docker/README.md)
- [Databases](databases.md)
- [Deployment](deployment.md)
- [Auth Module](modules/auth.md)
- [Finan Module](modules/finan.md)
- [Series Module](modules/series.md)
- [Acceptance Criteria Catalog](ACCEPTANCE_CRITERIA.md) — the living record of business rules; read this before changing behavior
- [Executable Specification Roadmap](specification-roadmap.md) — day-by-day project log, not a reference doc

## What this is

A Node.js/TypeScript/Express backend for an anime-tracking site (`animecream.com`), covering three independent domains — `auth`, `finan` (personal finance tracking), `series` (anime catalog) — built with Clean/Hexagonal Architecture (`series` also uses CQRS). See `architecture.md` for the real shape, `SPECIFICATION.md` for the conventions new code must follow, and the Acceptance Criteria Catalog for the non-obvious business rules a rewrite would need to reproduce.

## Getting started

See `setup.md` for the real steps (env vars, Docker, npm scripts, verification). Don't duplicate them here — this index has drifted from reality before by doing exactly that (e.g. it used to reference `npm run dev`/`npm start`, neither of which exists in `package.json` — the real dev script is `npm run servers`).

## Databases

One database per module, schema split across three sibling repos. See `databases.md` for the real table/view/procedure inventory, and `docker/README.md` for running them locally.

## API documentation

Swagger UI at `http://localhost:3001/api-docs` once the server is running.

## Contributing

Standard fork → branch → commit → PR flow. Before changing behavior in `auth`/`finan`/`series`, check `ACCEPTANCE_CRITERIA.md` first — several rules in this codebase look like bugs but are deliberate (e.g. series' qualification rescaling, finan's duplicate-prevention returning the original record). Full test suite (`npm run test:cov`) must stay at 100% coverage; it's a CI gate.

---

**Last updated**: 2026-07-18
**Version**: 2.0.9
