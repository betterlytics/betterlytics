#!/bin/sh
# Derives every password and auth key from SECRET_BASE. Sourced by entrypoint.sh in both modes.
# Safe to refuse: without SECRET_BASE no database password exists, so no working install has it empty.
[ -n "$SECRET_BASE" ] || fail "SECRET_BASE is not set. Set it in .env to 32+ random characters (openssl rand -hex 32), then run docker compose up -d --wait."

# Docker creates a directory at the mount target when the host file is missing.
if [ ! -f /derive.sh ]; then
    echo "betterlytics: /derive.sh is missing. Mount base/derive.sh from the betterlytics-selfhost repository to /derive.sh (the official docker-compose.yml does this)." >&2
    exit 1
fi
. /derive.sh

export CLICKHOUSE_PASSWORD=$(derive_secret "clickhouse-admin" 32)
export CLICKHOUSE_BACKEND_PASSWORD=$(derive_secret "clickhouse-backend" 32)
export CLICKHOUSE_DASHBOARD_PASSWORD=$(derive_secret "clickhouse-dashboard" 32)
export WORKER_CLICKHOUSE_WRITE_PASSWORD=$(derive_secret "clickhouse-worker" 32)
export POSTGRES_PASSWORD=$(derive_secret "postgres" 32)
export POSTGRES_SITECONFIG_RO_PASSWORD=$(derive_secret "postgres-siteconfig-ro" 32)
export POSTGRES_MONITORING_RO_PASSWORD=$(derive_secret "postgres-monitoring-ro" 32)
export POSTGRES_SALTS_RW_PASSWORD=$(derive_secret "postgres-salts-rw" 32)
export POSTGRES_JOBQUEUE_RW_PASSWORD=$(derive_secret "postgres-jobqueue-rw" 32)
export AUTH_SECRET=$(derive_secret "auth" 64)
export INTEGRATION_ENCRYPTION_KEY=$(derive_secret "integration-encryption" 32)
# The dashboard refuses to boot when both status flags are on and this is empty.
export STATUS_PAGE_ASK_SECRET=$(derive_secret "status-page-ask" 32)

export POSTGRES_URL="postgresql://user:${POSTGRES_PASSWORD}@postgres:5432/dashboard?schema=public"
export SITE_CONFIG_DATABASE_URL="postgresql://siteconfig_ro:${POSTGRES_SITECONFIG_RO_PASSWORD}@postgres:5432/dashboard"
export MONITORING_DATABASE_URL="postgresql://monitoring_ro:${POSTGRES_MONITORING_RO_PASSWORD}@postgres:5432/dashboard"
export SALTS_DATABASE_URL="postgresql://salts_rw:${POSTGRES_SALTS_RW_PASSWORD}@postgres:5432/dashboard"
export JOB_QUEUE_DATABASE_URL="postgresql://jobqueue_rw:${POSTGRES_JOBQUEUE_RW_PASSWORD}@postgres:5432/dashboard"
