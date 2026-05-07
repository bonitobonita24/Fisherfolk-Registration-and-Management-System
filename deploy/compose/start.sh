#!/bin/bash
# Usage: bash deploy/compose/start.sh [dev|stage|prod] [up -d|down|restart]
# Dev: rebuilds the app image from source on every up (--build flag applied to app only)
# Stage/Prod: pulls pre-built image from Docker Hub — never builds from source
ENV=${1:-dev}
CMD=${@:2}
BASE=deploy/compose/$ENV
ROOT=$(cd "$(dirname "$0")/../.." && pwd)

# Map env name to env file
case "$ENV" in
  dev)     ENV_FILE="$ROOT/.env.dev" ;;
  stage)   ENV_FILE="$ROOT/.env.staging" ;;
  prod)    ENV_FILE="$ROOT/.env.prod" ;;
  *)       echo "Unknown environment: $ENV"; exit 1 ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ Env file not found: $ENV_FILE"
  exit 1
fi

DC="docker compose --env-file $ENV_FILE"

$DC -f $BASE/docker-compose.db.yml $CMD
$DC -f $BASE/docker-compose.cache.yml $CMD
$DC -f $BASE/docker-compose.storage.yml $CMD
$DC -f $BASE/docker-compose.pgadmin.yml $CMD
if [ "$ENV" = "dev" ]; then
  $DC -f $BASE/docker-compose.infra.yml $CMD
fi
# Dev: --build forces rebuild from source every time
if [ "$ENV" = "dev" ] && [[ "$CMD" == *"up"* ]]; then
  $DC -f $BASE/docker-compose.app.yml up --build -d
else
  $DC -f $BASE/docker-compose.app.yml $CMD
fi
