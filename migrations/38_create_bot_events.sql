CREATE TABLE IF NOT EXISTS analytics.bot_events (
    site_id LowCardinality(String),
    timestamp DateTime,
    date Date DEFAULT toDate(timestamp),
    domain LowCardinality(String) DEFAULT '',
    url String DEFAULT '',
    referrer String DEFAULT '',
    user_agent String DEFAULT '',
    screen_resolution String DEFAULT '',
    event_name String DEFAULT '',
    bot_reasons Array(LowCardinality(String))
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date, timestamp)
TTL timestamp + toIntervalMonth(3);
