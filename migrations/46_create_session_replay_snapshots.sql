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
