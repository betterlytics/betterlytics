#!/bin/bash

# ClickHouse Backup Script utilizing Clickhouse-backup CLI mode
# Usage: ./scripts/backup.sh [create|restore|list|status] [backup_name]

set -e

COMMAND="$1"
BACKUP_NAME="${2:-$(date +%Y%m%d_%H%M%S)}"
COMPOSE_FILE="docker-compose.production.yml"

RED='\033[0;31m'
NC='\033[0m' # No Color - if I don't add this then output remains red after the script is run

log_info() {
    echo "[INFO] $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

create_backup() {
    log_info "Creating backup: $BACKUP_NAME"
    docker compose -f $COMPOSE_FILE run --rm clickhouse-backup create "$BACKUP_NAME"
    log_info "Backup created successfully!"
}

restore_backup() {
    if [ -z "$BACKUP_NAME" ]; then
        log_error "Backup name is required for restore"
        exit 1
    fi
    
    log_info "Restoring backup: $BACKUP_NAME"
    docker compose -f $COMPOSE_FILE run --rm clickhouse-backup restore "$BACKUP_NAME"
    log_info "Backup restored successfully!"
}

list_backups() {
    log_info "Available backups:"
    docker compose -f $COMPOSE_FILE run --rm clickhouse-backup list
}

show_status() {
    log_info "Backup system status:"
    docker compose -f $COMPOSE_FILE run --rm clickhouse-backup print-config
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
    "status")
        show_status
        ;;
    *)
        echo "Usage: $0 [create|restore|list|status] [backup_name]"
        echo ""
        echo "Examples:"
        echo "  $0 create                    # Create backup with timestamp"
        echo "  $0 create pre_migration      # Create backup with custom name"
        echo "  $0 restore pre_migration     # Restore specific backup"
        echo "  $0 list                      # List all backups"
        echo "  $0 status                    # Show backup system status"
        exit 1
        ;;
esac
