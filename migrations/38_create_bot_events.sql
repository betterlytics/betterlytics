-- No TTL: full bot-event history is the evidence base for tuning filter rules.
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
    bot_reasons Array(LowCardinality(String)),
    asn UInt32 DEFAULT 0,
    asn_org LowCardinality(String) DEFAULT ''
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, date, timestamp);

ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS asn UInt32 DEFAULT 0;
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS asn_org LowCardinality(String) DEFAULT '';
