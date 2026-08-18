CREATE TABLE IF NOT EXISTS analytics.session_replay_segments (
    site_id String,
    session_id UInt64,
    filename String,
    epoch_ms Int64,
    date Date,
    size_bytes UInt64,
    data String CODEC(ZSTD(3))
) ENGINE = MergeTree
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, session_id, epoch_ms)
TTL date + INTERVAL 2 MONTH DELETE;

ALTER TABLE analytics.session_replays
    ADD COLUMN IF NOT EXISTS storage LowCardinality(String) DEFAULT 's3';
