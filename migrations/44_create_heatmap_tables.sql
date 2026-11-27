-- One row per heatmap click, not tied to a visitor or session. No TTL: like
-- events, clicks are deleted by the per-dashboard retention purge.
CREATE TABLE IF NOT EXISTS analytics.heatmap_clicks (
    site_id LowCardinality(String),
    url String,
    device LowCardinality(String),
    viewport_width UInt16,
    document_height UInt32,
    page_x UInt32,
    page_y UInt32,
    selector String,
    offset_x Float32,
    offset_y Float32,
    is_fixed Bool,
    timestamp DateTime
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(timestamp)
ORDER BY (site_id, device, url, timestamp)
SETTINGS non_replicated_deduplication_window = 100;

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

-- One row per full snapshot in a session replay, so the Heatmaps page can find the newest
-- layout of a page on a device without reading segments. Expires with the replays: the
-- post-migration script rewrites the TTL from REPLAY_RETENTION_DAYS like the replay tables.
CREATE TABLE IF NOT EXISTS analytics.session_replay_snapshots (
    site_id LowCardinality(String),
    session_id UInt64,
    url String,
    device LowCardinality(String),
    viewport_width UInt16,
    viewport_height UInt16,
    filename String,
    snapshot_ms Int64,
    timestamp DateTime,
    date Date
) ENGINE = MergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, device, url, timestamp)
TTL date + INTERVAL 2 MONTH DELETE;
