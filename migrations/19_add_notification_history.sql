CREATE TABLE IF NOT EXISTS analytics.notification_history
(
    ts               DateTime64(3) DEFAULT now(),
    dashboard_id     String,
    integration_type LowCardinality(String),
    title            String,
    status           LowCardinality(String),  -- sent, failed
    error_message    String DEFAULT ''
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(ts)
ORDER BY (dashboard_id, ts)
TTL ts + INTERVAL 90 DAY;
