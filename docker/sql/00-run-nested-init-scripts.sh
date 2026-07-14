#!/bin/bash
# MariaDB's own docker-entrypoint.sh only processes TOP-LEVEL files in
# /docker-entrypoint-initdb.d/ — it explicitly ignores subdirectories (logs
# "ignoring /docker-entrypoint-initdb.d/<name>" and moves on). This project's
# schema lives in three separate sibling repositories, each mounted as a
# nested subdirectory by docker-compose.yml (animecream-data/sql, auth-data/sql,
# finan-data/sql), so none of it was ever actually being applied by the
# built-in mechanism. This script is itself a top-level file, so the
# entrypoint runs it directly.
#
# Only applies structure + views/procs + triggers (the "bootstrap a new,
# empty environment" set per each repo's README) — deliberately skips
# db-data.sql (real data, not appropriate to auto-load into a fresh
# CI/dev database) and db-swap.sql (a generated artifact for the
# migration-deploy pipeline, not a general-purpose init script).
set -e

declare -A db_map=(
  [animecream]=animecre_cake514
  [auth]=animecre_auth
  [finan]=animecre_finan
)

for name in animecream auth finan; do
  dir="/docker-entrypoint-initdb.d/$name"
  db="${db_map[$name]}"
  [ -d "$dir" ] || continue

  for filename in db-structure.sql db-views-procs.sql db-trigger.sql; do
    f="$dir/$filename"
    [ -e "$f" ] || continue
    echo "[nested-init] Applying $f (database: $db)"
    # db-structure.sql's own CREATE DATABASE IF NOT EXISTS needs to run without
    # a database already selected on a truly fresh instance.
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS \`$db\`;"
    mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$db" < "$f"
  done
done
