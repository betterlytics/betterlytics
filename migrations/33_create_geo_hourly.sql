DROP VIEW IF EXISTS analytics.geo_hourly_mv;
DROP TABLE IF EXISTS analytics.geo_hourly;

CREATE TABLE IF NOT EXISTS analytics.geo_hourly (
    site_id LowCardinality(String),
    hour DateTime,
    country_code LowCardinality(String),
    subdivision_code LowCardinality(String),
    city LowCardinality(String),
    visitors AggregateFunction(uniq, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (site_id, hour, country_code, subdivision_code, city)
SETTINGS min_rows_for_wide_part = 0, min_bytes_for_wide_part = 0;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.geo_hourly_mv
TO analytics.geo_hourly AS
SELECT
    site_id,
    toStartOfHour(session_created_at) AS hour,
    country_code,
    subdivision_code,
    city,
    uniqState(visitor_id) AS visitors
FROM analytics.events
GROUP BY site_id, hour, country_code, subdivision_code, city;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.geo_hourly
SELECT
    site_id,
    toStartOfHour(session_created_at) AS hour,
    country_code,
    subdivision_code,
    city,
    uniqState(visitor_id) AS visitors
FROM analytics.events
GROUP BY site_id, hour, country_code, subdivision_code, city;
