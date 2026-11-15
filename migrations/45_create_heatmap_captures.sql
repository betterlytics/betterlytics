-- One row per heatmap capture snapshot when REPLAY_STORAGE=clickhouse. No TTL on purpose:
-- captures are kept until pushed out of the last 10 per page and device, or deleted, so
-- neither replay expiry nor data retention applies. Metadata lives in Postgres.
CREATE TABLE IF NOT EXISTS analytics.heatmap_captures (
    site_id LowCardinality(String),
    capture_id String,
    size_bytes UInt64,
    data String CODEC(ZSTD(3))
) ENGINE = MergeTree
ORDER BY (site_id, capture_id);
