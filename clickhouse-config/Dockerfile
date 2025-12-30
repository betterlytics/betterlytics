FROM clickhouse/clickhouse-server:25.8

# Copy the initialization scripts
COPY setup/ /docker-entrypoint-initdb.d/

# Make all shell scripts executable
RUN chmod +x /docker-entrypoint-initdb.d/*.sh

# Copy the config
COPY config.d/config.xml /etc/clickhouse-server/config.d/config.xml

# Make config read/write/exec-able
RUN chmod +wrx /etc/clickhouse-server/config.d/config.xml

# Set the correct user (same as base image)
USER 101:101
