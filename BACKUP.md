# ClickHouse Backup Guide

## Create a Manual Backup

### pnpm

```bash
pnpm backup:create
# or with custom name
pnpm backup:create pre_migration
```

```bash
pnpm backup:list
```

```bash
pnpm backup:restore backup_name
```

```bash
pnpm backup:status
```

### Without pnpm:

```bash
./scripts/backup.sh create [name]
```

```bash
./scripts/backup.sh list
```

```bash
docker stop clickhouse
./scripts/backup.sh restore [name]
docker compose -f docker-compose.production.yml up clickhouse -d
```

Copy to local folder:

```bash
docker cp clickhouse:/var/lib/clickhouse ./clickhouse_data_backup
```
