#!/bin/bash

set -e

if [ -z "$CONNECTION_STRING" ]; then
    echo "[-] Postgres connection string required - run like: CONNECTION_STRING='...' ./scripts/deploy.sh"
    exit 1
fi

echo "Starting deployment..."

echo "Creating pre-migration backups..."
./scripts/backup.sh create "pre_migration_$(date +%Y%m%d_%H%M%S)"
./scripts/postgresbackup.sh create "pre_migration_$(date +%Y%m%d_%H%M%S)" $CONNECTION_STRING

echo "Deploying services..."
docker compose -f docker-compose.production.yml up -d --wait --build

echo "Waiting for services to be ready..."

docker compose -f docker-compose.production.yml ps

echo "Deployment completed successfully!"
