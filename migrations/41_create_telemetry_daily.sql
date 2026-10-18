CREATE TABLE IF NOT EXISTS analytics.telemetry_daily (
    date Date,
    instance_id UUID,
    version String
) ENGINE = ReplacingMergeTree
ORDER BY (date, instance_id)
TTL date + INTERVAL 365 DAY DELETE;
