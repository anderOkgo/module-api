# Docker setup — local MariaDB

Runs a single MariaDB 10.3.39 container (`animecream-mariadb`) hosting all three module databases locally. For the rest of the project's setup (Node, `.env`, npm scripts), see `docs/setup.md` — this file only covers the database container.

## Prerequisite: sibling schema repos

The actual table/view/procedure definitions for all three databases live **outside this repo**, in three sibling directories at the same level as `module-api/`:

```
Proyectos/
├── module-api/       (this repo)
├── animecream-data/   → schema for animecre_cake514 (series)
├── auth-data/         → schema for animecre_auth
└── finan-data/        → schema for animecre_finan
```

Clone all three next to `module-api` before running `docker-compose up` — `docker-compose.yml` mounts `../animecream-data/sql`, `../auth-data/sql`, and `../finan-data/sql`. Without them, the container starts but the databases stay empty.

## Quick start

```bash
cd docker
docker-compose up -d --build
docker-compose logs -f mariadb
docker ps
```

## What actually initializes the schema

MariaDB's own entrypoint only processes **top-level** `.sql`/`.sh` files in `/docker-entrypoint-initdb.d/` — it does **not** recurse into subdirectories. Since the three sibling repos are mounted as subdirectories (`/docker-entrypoint-initdb.d/animecream`, `/auth`, `/finan`), MariaDB would silently ignore all of them on its own. `docker/sql/00-run-nested-init-scripts.sh` is the fix: a top-level script (which the entrypoint *does* run) that manually applies each sibling repo's `db-structure.sql` → `db-views-procs.sql` → `db-trigger.sql`, in that order, for all three databases. The `.gitkeep` files under `docker/sql/{animecream,auth,finan}/` exist only so those mount points pre-exist (Docker Desktop on Windows refuses to bind-mount onto a path that doesn't already exist inside the parent mounted directory).

This means a **fresh container** (new volume, no prior state) gets a fully-structured, empty-of-real-data schema automatically. `db-data.sql` (real seed data) is deliberately **not** run automatically — don't auto-load real data into a disposable dev/CI database.

## Connecting

- Host: `localhost`, Port: `3306` (override via `MARIADB_PORT`)
- Root: `root` / `${MYSQL_ROOT_PASSWORD:-root}`
- App user: `${MYSQL_USER:-animecream}` / `${MYSQL_PASSWORD:-animecream123}`

```bash
docker exec -it animecream-mariadb mysql -u root -p
```

## Databases created (real, verified against the sibling repos' `db-structure.sql`)

| Database | Tables | Key views/procedures |
|---|---|---|
| `animecre_cake514` (series) | `productions`, `demographics`, `genres`, `titles`, `productions_genres` | `update_rank()`, `view_all_info_produtions`, `view_all_years_productions` + several `v_*` ranking/stats views |
| `animecre_auth` | `users`, `email_verification` | — |
| `animecre_finan` | `type_sources`, `constants`, plus one `movements_<username>` table **created dynamically per user** via `proc_create_movements_table` (not a single shared `movements` table) | 9 `proc_view_*`/`proc_monthly_*` procedures, `view_general_info`/`view_final_trip_info` (hardcoded to one specific account — see `docs/ACCEPTANCE_CRITERIA.md` #8) |

There is no fourth `animecre_series` database — `series` and the "main" catalog are the same database (`animecre_cake514`). Full column-level detail: read the sibling repos' `sql/db-structure.sql` directly, or see `docs/databases.md`.

## Common commands

```bash
docker-compose down              # stop
docker-compose down -v           # stop AND delete all data
docker-compose logs -f mariadb   # follow logs
docker exec -it animecream-mariadb mysql -u root -p -e "SHOW DATABASES;"
```

## Troubleshooting

- **Port 3306 already in use**: set `MARIADB_PORT` in your shell/`.env` before running `docker-compose up`, rather than editing the compose file.
- **A sibling repo's tables don't show up**: confirm it's actually cloned next to `module-api` and re-run `docker-compose up -d --build` — the init script only runs on a genuinely fresh volume; it won't re-apply to an already-initialized one (that's what `db-deploy-schema.bat`'s local-restore step is for, see `docs/specification-roadmap.md` Phase 5b).

---

**Last verified against source**: 2026-07-18
