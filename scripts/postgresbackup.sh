#!/bin/bash

# Postgres Backup Script
# Usage: ./scripts/postgresbackup.sh [create|restore|list] [backup_name] [connection_string]

set -e

COMMAND="$1"
BACKUP_NAME="$2"
CONNECTION_STRING="$3"
POSTGRES_CONTAINER="postgres"
BACKUP_DIR=./postgresbackups
BACKUP="$BACKUP_DIR/$BACKUP_NAME.backup"

mkdir -p "$BACKUP_DIR"

RED='\033[0;31m'
NC='\033[0m'

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_backup() {
    log_info "Creating backup: $BACKUP_NAME"
    docker exec $POSTGRES_CONTAINER pg_dump -d $CONNECTION_STRING -F c > $BACKUP
    log_info "Backup created successfully!"
}

restore_backup() {
    if [ -z "$BACKUP" ]; then
        log_error "Backup name is required for restore"
        exit 1
    fi
    
    log_info "Copying backup to container: $BACKUP_NAME"
    docker cp $BACKUP $POSTGRES_CONTAINER:/tmp/restore.backup

    log_info "Restoring backup: $BACKUP_NAME"
    docker exec $POSTGRES_CONTAINER pg_restore --clean -d $CONNECTION_STRING /tmp/restore.backup

    log_info "Backup restored successfully!"
}

list_backups() {
    log_info "Available backups:"
    ls -l $BACKUP_DIR
}

case "$COMMAND" in
    "create")
        create_backup
        ;;
    "restore")
        restore_backup
        ;;
    "list")
        list_backups
        ;;
    *)
        echo "Usage: $0 [create|restore|list] [backup_name] [connection_string]"
        echo ""
        echo "Examples:"
        echo "  $0 create pre_migration      # Create backup with custom name"
        echo "  $0 restore pre_migration     # Restore specific backup"
        echo "  $0 list                      # List all backups"
        exit 1
        ;;
esac
