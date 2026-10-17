#!/bin/sh
# Image entrypoint. `run` (default) starts the app; `init` runs migrations and exits.
set -e

MODE="${1:-run}"
case "$MODE" in
    run|init) ;;
    *)
        echo "betterlytics: unknown mode '$MODE' (expected run or init)." >&2
        exit 1
        ;;
esac

. /app/selfhost/env.sh
check_version
check_retired_names
resolve_public_url
apply_selfhost_defaults
. /app/selfhost/secrets-env.sh

if [ "$MODE" = "init" ]; then
    export PATH="/app/initializer/node_modules/.bin:$PATH"
    cd /app/initializer

    echo "Running ClickHouse migrations..."
    NODE_ENV=production node scripts/run-migration.js

    echo "Running ClickHouse post-migration grants..."
    node scripts/post_migrate_clickhouse.js

    echo "Running PostgreSQL migrations..."
    prisma migrate deploy --schema /app/initializer/prisma/schema.prisma

    echo "Checking DATA_RETENTION_DAYS carry-over..."
    node scripts/post_migrate_retention_env.js

    echo "Running pg-boss migrations..."
    node scripts/migrate_pgboss.js

    echo "Running post-migration scripts..."
    node scripts/provision_roles.js

    echo "Migrations complete."
    exit 0
fi

# Warn only (decision 2026-10-02): refusing would take down upgraded installs that have no way to rotate the secret.
warn_weak_secret_base() {
    if [ "$SECRET_BASE" = "CHANGEME" ] || [ "${#SECRET_BASE}" -lt 32 ]; then
        echo "WARNING: SECRET_BASE in .env is still CHANGEME or shorter than 32 characters." >&2
        echo "WARNING: Every database password and the sign-in key derive from it; anyone who can guess it can forge a login." >&2
        echo "WARNING: No data yet? Run docker compose down -v, set SECRET_BASE to 32+ random characters (openssl rand -hex 32), then docker compose up -d --wait." >&2
        echo "WARNING: Existing data: changing SECRET_BASE changes the database passwords. Read SECRET_BASE in the Self-Hosting Guide (Configuration Reference) first: https://betterlytics.io/docs/installation/self-hosting" >&2
    fi
}
warn_weak_secret_base

if [ "$TLS" = "auto" ]; then
    echo "Configuring Caddy with automatic HTTPS for $BL_PUBLIC_HOST..."
    export CADDY_SITE="$BL_PUBLIC_HOST"
    echo "Enabling on-demand TLS for custom status page domains..."
    # Relative to /etc/caddy.
    export CADDY_STATUS_SITE="sites/status.caddy"
else
    echo "Configuring Caddy without TLS..."
    export CADDY_SITE=":80"
    export CADDY_STATUS_SITE="sites/none.caddy"
fi
export CADDY_EMAIL_DIRECTIVE=""
if [ -n "$SSL_EMAIL" ]; then
    export CADDY_EMAIL_DIRECTIVE="email $SSL_EMAIL"
fi

caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile

echo "Starting services..."
# exec: supervisord must be PID 1 for the fatalexit listener's `kill -TERM 1`.
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/betterlytics.conf
