#!/bin/bash
set -e

# Create a user for backend ingress
clickhouse-client --query="CREATE USER IF NOT EXISTS ${CLICKHOUSE_BACKEND_USER} IDENTIFIED BY '${CLICKHOUSE_BACKEND_PASSWORD}';"

# Create a user for dashboard egress
clickhouse-client --query="CREATE USER IF NOT EXISTS ${CLICKHOUSE_DASHBOARD_USER} IDENTIFIED BY '${CLICKHOUSE_DASHBOARD_PASSWORD}';"

# Create roles
clickhouse-client --query="CREATE ROLE dashboard_role;"
clickhouse-client --query="CREATE ROLE backend_role;"

# Grant privileges to roles
clickhouse-client --query="GRANT SELECT ON analytics.*, INSERT ON analytics.*, ALTER ON analytics.*, CREATE VIEW ON analytics.*, SELECT ON system.databases, SELECT ON system.tables TO backend_role;"
clickhouse-client --query="GRANT SELECT ON analytics.* TO dashboard_role;"

# Assign roles to users
clickhouse-client --query="GRANT backend_role TO ${CLICKHOUSE_BACKEND_USER};"
clickhouse-client --query="GRANT dashboard_role TO ${CLICKHOUSE_DASHBOARD_USER};"
