#!/bin/bash
set -e

export PATH="/app/initializer/node_modules/.bin:$PATH"

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

if [ -n "$SSL_DOMAIN" ] && [ -n "$SSL_EMAIL" ]; then
    if [ ! -f "/etc/letsencrypt/live/$SSL_DOMAIN/fullchain.pem" ]; then
        echo "Obtaining SSL certificate for $SSL_DOMAIN..."
        cp /etc/nginx/templates/nginx.conf /etc/nginx/conf.d/default.conf
        nginx
        certbot certonly --webroot --non-interactive --agree-tos \
            --email "$SSL_EMAIL" \
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
