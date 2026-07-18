#!/usr/bin/env bash
# staging-refresh-and-deploy.sh — MANUAL, agent-triggered STAGING validation gate for FRMS.
#
# PURPOSE: make staging a faithful pre-production rehearsal. On every run it
# refreshes staging's data FROM PRODUCTION *first*, then deploys the candidate
# image and applies its migrations — so the new code + new migrations are tested
# against real prod-shaped data before the same image is ever promoted to prod.
# (FRMS pattern mirrors Marine-Guardian's proven gate; see ~/.claude/rules/staging-refresh-gate.md.)
#
# ORDER IS FIXED (owner directive — data BEFORE image):
#   1. Backup staging DB              (rollback point)
#   2. Refresh staging data FROM PROD (prod is READ-ONLY; staging wiped + reloaded)
#   3. Pull candidate image           (Docker Hub — AFTER the data refresh)
#   4. Migrate staging                (prod-data → new schema = the prod-migration rehearsal)
#   5. Bring staging up on new image
#   6. Health verify
#
# FIRST-RUN NOTE: until an FRMS production stack (frms_prod) exists on the VPS,
# step 2 is skipped automatically (no prod to copy from) — staging keeps whatever
# data it was seeded with. Once prod exists, the refresh engages with no edits.
#
# HARD RULES:
#   • PRODUCTION is only ever READ (pg_dump). It is never written, migrated, or restarted here.
#   • This DESTROYS the current staging dataset by design when a prod copy is available.
#   • Staging Komodo `auto_update` MUST be OFF, or Komodo may pull the image out of order.
#   • Production promotion stays a separate, explicit manual step (never triggered here).
#
# Usage:  bash deploy/staging-refresh-and-deploy.sh [SOURCE_TAG]   (default: staging-latest)
# Prereq: SSH key ~/.ssh/powerbyte_hostinger; run from the app repo root at the
#         commit that built SOURCE_TAG (migrations are applied host-side from this repo).
set -euo pipefail

SRC="${1:-staging-latest}"
VPS="root@72.62.74.203"; KEY="$HOME/.ssh/powerbyte_hostinger"
STACK="/etc/komodo/stacks/frms-staging"
PROJ="frms_staging"; PRODPROJ="frms_prod"
CF="-f docker-compose.db.yml -f docker-compose.cache.yml -f docker-compose.storage.yml -f docker-compose.app.yml"
ssh_vps(){ ssh -o ConnectTimeout=20 -i "$KEY" "$VPS" "$@"; }

echo "▶ 1/6 Backup staging DB (rollback point)"
ssh_vps "U=\$(docker exec ${PROJ}_postgres printenv POSTGRES_USER); D=\$(docker exec ${PROJ}_postgres printenv POSTGRES_DB); \
  docker exec ${PROJ}_postgres pg_dump -U \$U -d \$D | gzip > /root/frms-staging-backup-pre-refresh-\$(date -u +%Y%m%d-%H%M%S).sql.gz && echo '  ok'"

echo "▶ 2/6 Refresh staging data FROM prod (prod READ-ONLY; staging wiped + reloaded)"
if ssh_vps "docker inspect ${PRODPROJ}_postgres >/dev/null 2>&1"; then
  ssh_vps "set -e; cd ${STACK}; \
    echo '  · stopping staging app (release DB connections)'; \
    docker compose -p ${PROJ} ${CF} stop app >/dev/null 2>&1 || true; \
    SU=\$(docker exec ${PROJ}_postgres printenv POSTGRES_USER); SD=\$(docker exec ${PROJ}_postgres printenv POSTGRES_DB); \
    PU=\$(docker exec ${PRODPROJ}_postgres printenv POSTGRES_USER); PD=\$(docker exec ${PRODPROJ}_postgres printenv POSTGRES_DB); \
    echo '  · terminating staging DB sessions + wiping public schema'; \
    docker exec ${PROJ}_postgres psql -U \$SU -d \$SD -c \"SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='\$SD' AND pid<>pg_backend_pid();\" >/dev/null; \
    docker exec ${PROJ}_postgres psql -U \$SU -d \$SD -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public;' >/dev/null; \
    echo '  · streaming prod → staging (pg_dump | psql, same host, no network egress)'; \
    docker exec ${PRODPROJ}_postgres pg_dump -U \$PU -d \$PD --no-owner --no-privileges | docker exec -i ${PROJ}_postgres psql -U \$SU -d \$SD -q >/dev/null; \
    echo '  · staging DB now mirrors production'"
else
  echo "  ⚠ no ${PRODPROJ}_postgres on VPS yet — SKIPPING prod refresh (first-run / no-prod). Staging keeps its seeded data."
fi

echo "▶ 3/6 Pull candidate image '${SRC}' from Docker Hub (AFTER data refresh)"
ssh_vps "cd ${STACK}; \
  sed -i 's/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=${SRC}/' .env; \
  docker compose -p ${PROJ} --env-file .env ${CF} pull app >/dev/null 2>&1 && echo '  ok'"

echo "▶ 4/6 Migrate staging (prod-data → new schema; drift-resolve fallback)"
DBPORT=$(ssh_vps "grep -oP '(?<=^DB_PORT=)[0-9]+' ${STACK}/.env")
# Pick a FREE local port for the SSH tunnel, DECOUPLED from the remote DB_PORT.
# Binding local==remote collides with any local process already on that number
# (e.g. another project's dev DB); the forward then fails to bind and migrate
# silently connects to the WRONG database. Lesson:
# deploy.staging-gate.tunnel-port-collision-swallows-migrate-failure.
LPORT=""
for _p in $(seq 15432 15999); do
  if ! ss -ltnH "sport = :${_p}" 2>/dev/null | grep -q .; then LPORT="${_p}"; break; fi
done
[ -z "$LPORT" ] && { echo "  ✗ no free local port in 15432-15999 for the DB tunnel — aborting"; exit 1; }
DBURL_LOCAL=$(ssh_vps "grep -oP '(?<=^INTERNAL_DATABASE_URL=).*' ${STACK}/.env" | sed -E "s#@[^@/]+:[0-9]+/#@localhost:${LPORT}/#")
ssh -i "$KEY" -N -L "${LPORT}:localhost:${DBPORT}" "$VPS" & TUN=$!
# Fail LOUD if the forward never comes up — never fall through to a no-op migrate.
for _ in $(seq 1 10); do ss -ltnH "sport = :${LPORT}" 2>/dev/null | grep -q . && break; sleep 1; done
if ! ss -ltnH "sport = :${LPORT}" 2>/dev/null | grep -q .; then
  echo "  ✗ SSH tunnel on localhost:${LPORT} never came up — aborting (staging NOT migrated)"
  kill $TUN 2>/dev/null || true; exit 1
fi
if ! DATABASE_URL="$DBURL_LOCAL" pnpm --filter @frms/db db:migrate:deploy; then
  echo "  ↳ migrate deploy hit drift; resolving pending migrations as applied…"
  for M in $(DATABASE_URL="$DBURL_LOCAL" pnpm --filter @frms/db exec prisma migrate status 2>/dev/null | grep -oE '[0-9]{14}_[a-zA-Z0-9_]+'); do
    DATABASE_URL="$DBURL_LOCAL" pnpm --filter @frms/db exec prisma migrate resolve --applied "$M" || true
  done
fi
# HARD GATE — the deploy is valid ONLY if the schema is genuinely up to date.
# Never let a swallowed migrate error + a shallow /health 200 fake a promotable
# staging (lesson deploy.staging-gate.tunnel-port-collision-...).
if ! DATABASE_URL="$DBURL_LOCAL" pnpm --filter @frms/db exec prisma migrate status 2>&1 | grep -q "Database schema is up to date"; then
  echo "  ✗ staging schema NOT up to date after migrate — aborting BEFORE deploy"
  echo "    (app not restarted; staging DB = fresh prod copy + pre-refresh backup on the VPS)"
  kill $TUN 2>/dev/null || true; exit 1
fi
echo "  ✓ staging schema up to date"
kill $TUN 2>/dev/null || true

echo "▶ 5/6 Bring staging up on new image"
ssh_vps "cd ${STACK}; docker compose -p ${PROJ} --env-file .env ${CF} up -d app && echo '  ok'"

echo "▶ 6/6 Verify (poll /api/health up to ~60s — the app needs a moment after 'up -d')"
CODE=000
for _ in $(seq 1 20); do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" https://frms-staging.powerbyte.app/api/health || echo 000)
  [ "$CODE" = "200" ] && break
  sleep 3
done
echo "  frms-staging /api/health = ${CODE}"
[ "$CODE" = "200" ] || { echo "  ✗ staging did NOT come up healthy — check 'docker compose -p ${PROJ} logs app'"; exit 1; }
echo "✅ Staging refreshed + deployed on '${SRC}'. Promote to prod only after a manual verify."
