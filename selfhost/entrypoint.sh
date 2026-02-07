#!/bin/bash
set -e

export PATH="/app/initializer/node_modules/.bin:$PATH"

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

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/betterlytics.conf
