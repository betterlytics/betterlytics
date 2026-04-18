DROP VIEW IF EXISTS analytics.overview_hourly_mv;
DROP TABLE IF EXISTS analytics.overview_hourly;

CREATE TABLE IF NOT EXISTS analytics.overview_hourly (
    site_id LowCardinality(String),
    hour DateTime,
    device_type LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    country_code LowCardinality(String),
    visitors AggregateFunction(uniq, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (site_id, hour, device_type, browser, os, country_code)
SETTINGS min_rows_for_wide_part = 0, min_bytes_for_wide_part = 0;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.overview_hourly_mv
TO analytics.overview_hourly AS
SELECT
    site_id,
    toStartOfHour(session_created_at) AS hour,
    device_type,
    browser,
    os,
    country_code,
    uniqState(visitor_id) AS visitors
FROM analytics.events
GROUP BY site_id, hour, device_type, browser, os, country_code;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.overview_hourly
SELECT
    site_id,
    toStartOfHour(session_created_at) AS hour,
    device_type,
    browser,
    os,
    country_code,
    uniqState(visitor_id) AS visitors
FROM analytics.events
GROUP BY site_id, hour, device_type, browser, os, country_code;

OPTIMIZE TABLE analytics.overview_hourly FINAL;
