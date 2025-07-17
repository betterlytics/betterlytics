#!/bin/bash

set -e

echo "Starting deployment..."

echo "Creating pre-migration backup..."
docker compose -f docker-compose.production.yml run --rm clickhouse-backup create "pre_migration_$(date +%Y%m%d_%H%M%S)"

echo "Deploying services..."
docker compose -f docker-compose.production.yml up -d --build

echo "Waiting 30 seconds for services to be ready..."
sleep 30

docker compose -f docker-compose.production.yml ps

echo "Deployment completed successfully!"
