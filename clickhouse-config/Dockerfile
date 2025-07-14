FROM clickhouse/clickhouse-server:latest

# Copy the initialization scripts
COPY setup/ /docker-entrypoint-initdb.d/

# Make all shell scripts executable
RUN chmod +x /docker-entrypoint-initdb.d/*.sh

# Backups
RUN mkdir /backups
RUN chmod +x /backups

# Set the correct user (same as base image)
USER 101:101
