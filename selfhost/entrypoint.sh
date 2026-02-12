#!/bin/bash
set -e

export PATH="/app/initializer/node_modules/.bin:$PATH"

if [ -n "$SECRET_BASE" ]; then
    derive_secret() {
        _result="" _i=0
        while [ ${#_result} -lt "$2" ]; do
            _chunk=$(printf '%s:%d' "$1" "$_i" | openssl dgst -sha256 -hmac "$SECRET_BASE" -binary | openssl base64 -A | tr '+/' '-_' | tr -d '=')
            _result="${_result}${_chunk}" _i=$((_i + 1))
        done
        printf '%s' "$_result" | head -c "$2"
    }

    export CLICKHOUSE_PASSWORD=$(derive_secret "clickhouse-admin" 32)
    export CLICKHOUSE_BACKEND_PASSWORD=$(derive_secret "clickhouse-backend" 32)
    export CLICKHOUSE_DASHBOARD_PASSWORD=$(derive_secret "clickhouse-dashboard" 32)
    export POSTGRES_PASSWORD=$(derive_secret "postgres" 32)
    export POSTGRES_SITECONFIG_RO_PASSWORD=$(derive_secret "postgres-siteconfig-ro" 32)
    export NEXTAUTH_SECRET=$(derive_secret "nextauth" 64)
    export TOTP_SECRET_ENCRYPTION_KEY=$(derive_secret "totp-encryption" 32)

    export POSTGRES_URL="postgresql://user:${POSTGRES_PASSWORD}@localhost:5432/dashboard?schema=public"
    export SITE_CONFIG_DATABASE_URL="postgresql://siteconfig_ro:${POSTGRES_SITECONFIG_RO_PASSWORD}@localhost:5432/dashboard"
fi

PG_DATA="/var/lib/postgresql/data"
PG_BIN="/usr/lib/postgresql/17/bin"

if [ ! -s "$PG_DATA/PG_VERSION" ]; then
    echo "Initializing PostgreSQL..."
    mkdir -p "$PG_DATA"
    chown postgres:postgres "$PG_DATA"
    su - postgres -c "$PG_BIN/initdb -D $PG_DATA"
    echo "host all all 0.0.0.0/0 md5" >> "$PG_DATA/pg_hba.conf"
    echo "listen_addresses = '127.0.0.1'" >> "$PG_DATA/postgresql.conf"
fi

echo "Starting PostgreSQL..."
su - postgres -c "$PG_BIN/pg_ctl -D $PG_DATA -w start"

if ! su - postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='$POSTGRES_USER'\"" | grep -q 1; then
    echo "Creating PostgreSQL user and database..."
    su - postgres -c "psql -c \"CREATE USER \\\"$POSTGRES_USER\\\" WITH SUPERUSER PASSWORD '$POSTGRES_PASSWORD';\""
    su - postgres -c "psql -c \"CREATE DATABASE \\\"$POSTGRES_DB\\\" OWNER \\\"$POSTGRES_USER\\\";\""
fi

echo "Running ClickHouse migrations..."
cd /app/initializer
NODE_ENV=production node scripts/run-migration.js

echo "Running PostgreSQL migrations..."
prisma migrate deploy --schema /app/initializer/prisma/schema.prisma

echo "Running post-migration scripts..."
node scripts/post_migrate_siteconfig_ro.js
node scripts/post_migrate_monitoring_ro.js

if [ "$HTTP_SCHEME" = "https" ] && [ -n "$SSL_DOMAIN" ]; then
    if [ ! -f "/etc/letsencrypt/live/$SSL_DOMAIN/fullchain.pem" ]; then
        echo "Obtaining SSL certificate for $SSL_DOMAIN..."
        cp /etc/nginx/templates/nginx.conf /etc/nginx/conf.d/default.conf
        nginx
        if [ -n "$SSL_EMAIL" ]; then
            CERTBOT_EMAIL_FLAG="--email $SSL_EMAIL"
        else
            CERTBOT_EMAIL_FLAG="--register-unsafely-without-email"
        fi
        certbot certonly --webroot --non-interactive --agree-tos \
            $CERTBOT_EMAIL_FLAG \
            -d "$SSL_DOMAIN" \
            -w /var/www/certbot
        nginx -s stop
    fi

    echo "Configuring nginx with SSL..."
    export SSL_DOMAIN
    envsubst '${SSL_DOMAIN}' < /etc/nginx/templates/nginx-ssl.conf > /etc/nginx/conf.d/default.conf
else
    echo "Configuring nginx without SSL..."
    cp /etc/nginx/templates/nginx.conf /etc/nginx/conf.d/default.conf
fi

echo "Stopping bootstrap PostgreSQL (supervisord will manage it)..."
su - postgres -c "$PG_BIN/pg_ctl -D $PG_DATA -w stop"

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/betterlytics.conf
