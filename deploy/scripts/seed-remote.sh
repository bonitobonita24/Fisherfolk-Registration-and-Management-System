#!/usr/bin/env bash
#
# seed-remote.sh — Seed an FRMS environment (staging or production) with the
# official fisherfolk masterlist plus demo data for the other modules.
#
#   prod  → real 3,002 official records (from the canonical SQLite masterlist)
#           + modest demo Vessels / Ayuda / Violations
#   stage → ANONYMIZED subset of fisherfolk (PII scrambled, no real photos)
#           + the same demo data
#
# Fisherfolk text-data only — real photos/signatures are NOT shipped by this
# script (a separate, optional asset-upload step handles those for production).
#
# HARD HOLD: this is an OWNER-RUN, manual operation. It is never auto-invoked by
# CI or the deploy pipeline. Production runs require an explicit confirmation.
#
# Usage:
#   bash deploy/scripts/seed-remote.sh <stage|prod> [options]
#     --limit <n>        staging subset size (default 300; ignored for prod)
#     --vessels <n>      demo vessels (default 80)
#     --beneficiaries <n> demo ayuda beneficiaries per program (default 40)
#     --violations <n>   demo violations (default 12)
#     --no-demo          skip demo Vessels/Ayuda/Violations (fisherfolk only)
#     --db <path>        path to fisherfolk.sqlite (default: sibling FMO project)
#     --yes              skip the production confirmation prompt
#
# Requires: python3, pnpm, and the target env file (.env.staging / .env.prod)
# present at repo root with a DATABASE_URL pointing at the remote DB.

set -euo pipefail

ENV="${1:-}"
shift || true
case "$ENV" in
  stage) ENV_FILE=".env.staging"; TARGET="staging" ;;
  prod)  ENV_FILE=".env.prod";    TARGET="production" ;;
  *) echo "❌ Usage: seed-remote.sh <stage|prod> [options]"; exit 1 ;;
esac

LIMIT=300
VESSELS=80
BENEF=40
VIOLATIONS=12
WITH_DEMO=1
ASSUME_YES=0
DB_PATH=""

while [ $# -gt 0 ]; do
  case "$1" in
    --limit) LIMIT="$2"; shift 2 ;;
    --vessels) VESSELS="$2"; shift 2 ;;
    --beneficiaries) BENEF="$2"; shift 2 ;;
    --violations) VIOLATIONS="$2"; shift 2 ;;
    --no-demo) WITH_DEMO=0; shift ;;
    --db) DB_PATH="$2"; shift 2 ;;
    --yes) ASSUME_YES=1; shift ;;
    *) echo "❌ Unknown option: $1"; exit 1 ;;
  esac
done

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Env file not found: $ENV_FILE (needs a DATABASE_URL for the $TARGET DB)"
  exit 1
fi

# Load the TARGET env into the environment. import-fmo.ts / seed-demo.ts use
# loadEnvFile() which never overrides an already-set var, so exporting the
# target env here pins them to the $TARGET database regardless of .env.dev.
set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ $ENV_FILE has no DATABASE_URL — cannot seed."
  exit 1
fi

echo "──────────────────────────────────────────────"
echo "  FRMS seed → $TARGET"
echo "  DB host : $(echo "$DATABASE_URL" | sed -E 's#.*@([^/?]+).*#\1#')"
echo "  Demo    : $([ "$WITH_DEMO" = 1 ] && echo "yes (vessels=$VESSELS, benef=$BENEF, violations=$VIOLATIONS)" || echo "no")"
[ "$ENV" = "stage" ] && echo "  Mode    : ANONYMIZED subset (limit=$LIMIT)"
[ "$ENV" = "prod" ]  && echo "  Mode    : REAL official masterlist (all records)"
echo "──────────────────────────────────────────────"

if [ "$ENV" = "prod" ] && [ "$ASSUME_YES" != 1 ]; then
  printf "⚠  This writes REAL fisherfolk PII to PRODUCTION. Type 'yes' to continue: "
  read -r CONFIRM
  [ "$CONFIRM" = "yes" ] || { echo "Aborted."; exit 1; }
fi

CACHE="$ROOT/.seed-cache"
mkdir -p "$CACHE"
EXPORT_JSON="$CACHE/fmo-export.json"
STAGING_JSON="$CACHE/fmo-staging.json"

# 1. Export canonical masterlist SQLite -> JSON ------------------------------
echo "▶ [1/3] Exporting masterlist from SQLite…"
python3 tools/seed/export-fmo.py ${DB_PATH:+--db "$DB_PATH"} --out "$EXPORT_JSON"

# 2. Choose the data file (anonymize for staging) ----------------------------
if [ "$ENV" = "stage" ]; then
  echo "▶ [2/3] Anonymizing + subsetting for staging…"
  python3 tools/seed/anonymize-fmo.py --in "$EXPORT_JSON" --out "$STAGING_JSON" --limit "$LIMIT"
  DATA_FILE="$STAGING_JSON"
else
  echo "▶ [2/3] Using real masterlist (production)."
  DATA_FILE="$EXPORT_JSON"
fi

# 3. Import fisherfolk + seed demo data --------------------------------------
echo "▶ [3/3] Importing fisherfolk into $TARGET DB…"
( cd apps/web && pnpm exec tsx scripts/import-fmo.ts --data "$DATA_FILE" )

if [ "$WITH_DEMO" = 1 ]; then
  echo "▶ Seeding demo Vessels / Ayuda / Violations…"
  ( cd apps/web && pnpm exec tsx scripts/seed-demo.ts \
      --vessels "$VESSELS" --beneficiaries "$BENEF" --violations "$VIOLATIONS" )
fi

echo "✅ Seed complete for $TARGET."
