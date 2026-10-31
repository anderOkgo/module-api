# Project conventions

- **Documentation and code comments must always be written in
  English**, regardless of the language used in conversation. This
  applies to README files, `docs/*.md`, inline code comments, and
  commit messages. Conversational replies to the user can stay in
  whatever language they use.

# Development process

This repo is part of the Animecream workspace (`D:\Proyectos`). Follow
`../module-docs/DEVELOPMENT-PROCESS.md` — Part E for the multi-repo rules,
Part D.1 for the workspace annex (environments, release, known traps).

- Application specs live in `../module-docs/apps/<app>/SPEC.md`. This repo
  implements them; it never redefines the contract or the data model on its
  own. Only spec sections marked `AGREED` are implemented.
- Every non-trivial change has one doc: `docs/changes/<CHANGE-ID>.md`, where
  the change ID is `YYYYMMDD-short-name`. A change that comes from a spec
  reuses the ID from the spec's change log and states `Implements: SPEC vX.Y`.
- Before creating a change doc, search this repo's `docs/changes/` and the
  spec's change log; update an existing doc instead of creating a new one.
