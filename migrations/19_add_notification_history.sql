CREATE TABLE IF NOT EXISTS analytics.notification_history
(
    ts               DateTime64(3) DEFAULT now(),
    dashboard_id     String,
    event_key        String,
    integration_type LowCardinality(String),
    title            String,
    message          String DEFAULT '',
    status           LowCardinality(String),  -- sent, failed
    error_message    String DEFAULT '',
    attempt_count    UInt8 DEFAULT 1,
    metadata         String DEFAULT '{}'
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (dashboard_id, ts);
