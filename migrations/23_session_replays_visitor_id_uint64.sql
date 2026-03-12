CREATE TABLE IF NOT EXISTS analytics.session_replays_new (
    site_id String,
    session_id String,
    visitor_id UInt64,
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

INSERT INTO analytics.session_replays_new (
    site_id, session_id, visitor_id, started_at, ended_at,
    duration, date, size_bytes, event_count, s3_prefix, start_url
)
SELECT
    site_id, session_id,
    reinterpretAsUInt64(reverse(unhex(substring(visitor_id, 1, 16)))) as visitor_id,
    started_at, ended_at,
    duration, date, size_bytes, event_count, s3_prefix, start_url
FROM analytics.session_replays;

RENAME TABLE
    analytics.session_replays TO analytics.session_replays_old,
    analytics.session_replays_new TO analytics.session_replays;
