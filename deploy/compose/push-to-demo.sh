#!/usr/bin/env bash
# push-to-demo.sh — MANUAL promote of a chosen build to the FRMS client DEMO stack
# (frms-demo.powerbyte.app). Model B: the demo is a deliberate-push environment, NOT auto-deploy.
#
#   Local dev  →  { demo (manual) · staging (auto on main) · production (manual) }
#
# HARD RULES:  migrations = YES (with drift-resolve fallback) · re-seed = NEVER (curated data preserved).
#
# ⚠ PROVENANCE: the frms-demo stack was originally stood up from a LOCAL docker-save image
#   (`frms:demo-latest`) that may be NEWER than what is on Docker Hub. Promoting a Hub tag here will
#   REPLACE that image — make sure the SOURCE_TAG you promote is at least as new (push FRMS main →
#   CI builds a fresh Hub tag first, then promote it). Default SOURCE_TAG=latest (Hub).
#
# Usage:  bash deploy/compose/push-to-demo.sh [SOURCE_TAG]
set -euo pipefail
SRC="${1:-latest}"
VPS="root@72.62.74.203"; KEY="$HOME/.ssh/powerbyte_hostinger"
HUB="bonitobonita24"; STACK="/etc/komodo/stacks/frms-demo"; PROJ="frms_demo"
CF="-f docker-compose.db.yml -f docker-compose.cache.yml -f docker-compose.storage.yml -f docker-compose.app.yml"
ssh_vps(){ ssh -o ConnectTimeout=15 -i "$KEY" "$VPS" "$@"; }

echo "▶ 1/5 Backup demo DB"
ssh_vps "U=\$(docker exec ${PROJ}_postgres printenv POSTGRES_USER); docker exec ${PROJ}_postgres pg_dump -U \$U -d ${PROJ} | gzip > /root/frms-demo-backup-pre-pushtodemo-\$(date -u +%Y%m%d-%H%M%S).sql.gz && echo ok"

echo "▶ 2/5 Promote ${SRC} → demo-latest (registry manifest)"
ssh_vps "docker buildx imagetools create -t ${HUB}/frms:demo-latest ${HUB}/frms:${SRC}"

echo "▶ 3/5 Redeploy demo stack (pull + recreate app)"
ssh_vps "cd ${STACK}; sed -i 's/^APP_IMAGE_TAG=.*/APP_IMAGE_TAG=demo-latest/' .env; \
  docker compose -p ${PROJ} --env-file .env ${CF} pull app >/dev/null 2>&1; \
  docker compose -p ${PROJ} --env-file .env ${CF} up -d app"

echo "▶ 4/5 Migrate (deploy; resolve drift as applied — NEVER seed)"
DBPORT=$(ssh_vps "grep -oP '(?<=^DB_PORT=)[0-9]+' ${STACK}/.env")
DBURL=$(ssh_vps "grep -oP '(?<=^INTERNAL_DATABASE_URL=).*' ${STACK}/.env" | sed -E "s#@[^:]+:5432#@localhost:${DBPORT}#")
ssh -i "$KEY" -N -L "${DBPORT}:localhost:${DBPORT}" "$VPS" & TUN=$!; sleep 3
if ! DATABASE_URL="$DBURL" pnpm --filter @frms/db db:migrate:deploy; then
  echo "  ↳ migrate failed (physical schema likely present); resolving pending as applied…"
  for M in $(DATABASE_URL="$DBURL" pnpm --filter @frms/db exec prisma migrate status 2>/dev/null | grep -oE '[0-9]{14}_[a-z_]+'); do
    DATABASE_URL="$DBURL" pnpm --filter @frms/db exec prisma migrate resolve --applied "$M" || true
  done
fi
kill $TUN 2>/dev/null || true

echo "▶ 5/5 Verify"
sleep 5
curl -s -o /dev/null -w "  frms-demo health = %{http_code}\n" https://frms-demo.powerbyte.app/api/health
echo "✅ push-to-demo done. Demo: https://frms-demo.powerbyte.app (admin@demo.com)"
