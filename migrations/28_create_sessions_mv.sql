ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS session_created_at DateTime DEFAULT timestamp;

DROP VIEW IF EXISTS analytics.sessions_mv;
DROP TABLE IF EXISTS analytics.sessions;

CREATE TABLE IF NOT EXISTS analytics.sessions (
    site_id LowCardinality(String),
    session_created_at DateTime,
    session_id UInt64,

    session_start SimpleAggregateFunction(min, DateTime),
    session_end SimpleAggregateFunction(max, DateTime),
    pageview_count SimpleAggregateFunction(sum, UInt64),

    entry_page SimpleAggregateFunction(min, Tuple(DateTime, String)),
    exit_page SimpleAggregateFunction(max, Tuple(DateTime, String)),

    visitor_id SimpleAggregateFunction(any, UInt64),
    domain SimpleAggregateFunction(any, LowCardinality(String)),
    device_type SimpleAggregateFunction(any, LowCardinality(String)),
    browser SimpleAggregateFunction(any, LowCardinality(String)),
    browser_version SimpleAggregateFunction(any, LowCardinality(String)),
    os SimpleAggregateFunction(any, LowCardinality(String)),
    os_version SimpleAggregateFunction(any, LowCardinality(String)),
    country_code SimpleAggregateFunction(any, LowCardinality(String)),
    subdivision_code SimpleAggregateFunction(any, LowCardinality(String)),
    city SimpleAggregateFunction(any, LowCardinality(String)),

    referrer_source SimpleAggregateFunction(min, Tuple(DateTime, String)),
    referrer_source_name SimpleAggregateFunction(min, Tuple(DateTime, String)),
    referrer_search_term SimpleAggregateFunction(min, Tuple(DateTime, String)),
    referrer_url SimpleAggregateFunction(min, Tuple(DateTime, String)),

    utm_source SimpleAggregateFunction(min, Tuple(DateTime, String)),
    utm_medium SimpleAggregateFunction(min, Tuple(DateTime, String)),
    utm_campaign SimpleAggregateFunction(min, Tuple(DateTime, String)),
    utm_term SimpleAggregateFunction(min, Tuple(DateTime, String)),
    utm_content SimpleAggregateFunction(min, Tuple(DateTime, String)),

    INDEX idx_session_end session_end TYPE minmax GRANULARITY 4
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(session_created_at)
ORDER BY (site_id, session_created_at, session_id)
SETTINGS min_rows_for_wide_part = 0, min_bytes_for_wide_part = 0;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.sessions_mv TO analytics.sessions AS
SELECT
    site_id,
    session_created_at,
    session_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    countIf(event_type = 'pageview') AS pageview_count,
    min(tuple(timestamp, url)) AS entry_page,
    max(tuple(timestamp, url)) AS exit_page,
    any(visitor_id) AS visitor_id,
    any(domain) AS domain,
    any(device_type) AS device_type,
    any(browser) AS browser,
    any(browser_version) AS browser_version,
    any(os) AS os,
    any(os_version) AS os_version,
    any(country_code) AS country_code,
    any(subdivision_code) AS subdivision_code,
    any(city) AS city,
    min(tuple(timestamp, referrer_source)) AS referrer_source,
    min(tuple(timestamp, referrer_source_name)) AS referrer_source_name,
    min(tuple(timestamp, referrer_search_term)) AS referrer_search_term,
    min(tuple(timestamp, referrer_url)) AS referrer_url,
    min(tuple(timestamp, utm_source)) AS utm_source,
    min(tuple(timestamp, utm_medium)) AS utm_medium,
    min(tuple(timestamp, utm_campaign)) AS utm_campaign,
    min(tuple(timestamp, utm_term)) AS utm_term,
    min(tuple(timestamp, utm_content)) AS utm_content
FROM analytics.events
GROUP BY site_id, session_created_at, session_id;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.sessions
SELECT
    site_id,
    min(timestamp) AS session_created_at,
    session_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    countIf(event_type = 'pageview') AS pageview_count,
    min(tuple(timestamp, url)) AS entry_page,
    max(tuple(timestamp, url)) AS exit_page,
    any(visitor_id) AS visitor_id,
    any(domain) AS domain,
    any(device_type) AS device_type,
    any(browser) AS browser,
    any(browser_version) AS browser_version,
    any(os) AS os,
    any(os_version) AS os_version,
    any(country_code) AS country_code,
    any(subdivision_code) AS subdivision_code,
    any(city) AS city,
    min(tuple(timestamp, referrer_source)) AS referrer_source,
    min(tuple(timestamp, referrer_source_name)) AS referrer_source_name,
    min(tuple(timestamp, referrer_search_term)) AS referrer_search_term,
    min(tuple(timestamp, referrer_url)) AS referrer_url,
    min(tuple(timestamp, utm_source)) AS utm_source,
    min(tuple(timestamp, utm_medium)) AS utm_medium,
    min(tuple(timestamp, utm_campaign)) AS utm_campaign,
    min(tuple(timestamp, utm_term)) AS utm_term,
    min(tuple(timestamp, utm_content)) AS utm_content
FROM analytics.events
GROUP BY site_id, session_id;

OPTIMIZE TABLE analytics.sessions FINAL;
