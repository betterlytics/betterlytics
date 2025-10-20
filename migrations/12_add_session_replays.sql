CREATE TABLE IF NOT EXISTS analytics.session_replays (
    site_id String,
    session_id String,
    visitor_id String,
    started_at DateTime,
    ended_at DateTime,
    duration UInt32,
    date Date,
    size_bytes UInt64,
    event_count UInt32,
    s3_prefix String,
    start_url String
) ENGINE = ReplacingMergeTree(ended_at)
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, session_id)
TTL date + INTERVAL 2 MONTH DELETE;