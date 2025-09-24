CREATE TABLE IF NOT EXISTS analytics.session_replays (
    site_id String,
    session_id String,
    visitor_id String,
    started_at DateTime,
    ended_at DateTime,
    duration UInt32,
    date Date DEFAULT toDate(started_at),

    size_bytes UInt64,
    segment_count UInt16,
    s3_prefix String,
	sample_rate UInt8,
    start_url String
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date, started_at, session_id);


