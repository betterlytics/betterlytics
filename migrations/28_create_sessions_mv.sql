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

    entry_page AggregateFunction(argMin, String, DateTime),
    exit_page AggregateFunction(argMax, String, DateTime),

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

    referrer_source AggregateFunction(argMin, LowCardinality(String), DateTime),
    referrer_source_name AggregateFunction(argMin, String, DateTime),
    referrer_search_term AggregateFunction(argMin, String, DateTime),
    referrer_url AggregateFunction(argMin, String, DateTime),

    utm_source AggregateFunction(argMin, String, DateTime),
    utm_medium AggregateFunction(argMin, LowCardinality(String), DateTime),
    utm_campaign AggregateFunction(argMin, String, DateTime),
    utm_term AggregateFunction(argMin, String, DateTime),
    utm_content AggregateFunction(argMin, String, DateTime)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(session_created_at)
ORDER BY (site_id, session_created_at, session_id)
TTL session_created_at + toIntervalDay(365);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.sessions_mv TO analytics.sessions AS
SELECT
    site_id,
    session_created_at,
    session_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    countIf(event_type = 'pageview') AS pageview_count,
    argMinState(url, timestamp) AS entry_page,
    argMaxState(url, timestamp) AS exit_page,
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
    argMinState(referrer_source, timestamp) AS referrer_source,
    argMinState(referrer_source_name, timestamp) AS referrer_source_name,
    argMinState(referrer_search_term, timestamp) AS referrer_search_term,
    argMinState(referrer_url, timestamp) AS referrer_url,
    argMinState(utm_source, timestamp) AS utm_source,
    argMinState(utm_medium, timestamp) AS utm_medium,
    argMinState(utm_campaign, timestamp) AS utm_campaign,
    argMinState(utm_term, timestamp) AS utm_term,
    argMinState(utm_content, timestamp) AS utm_content
FROM analytics.events
GROUP BY site_id, session_created_at, session_id;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.sessions
SELECT
    site_id,
    session_created_at,
    session_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    countIf(event_type = 'pageview') AS pageview_count,
    argMinState(url, timestamp) AS entry_page,
    argMaxState(url, timestamp) AS exit_page,
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
    argMinState(referrer_source, timestamp) AS referrer_source,
    argMinState(referrer_source_name, timestamp) AS referrer_source_name,
    argMinState(referrer_search_term, timestamp) AS referrer_search_term,
    argMinState(referrer_url, timestamp) AS referrer_url,
    argMinState(utm_source, timestamp) AS utm_source,
    argMinState(utm_medium, timestamp) AS utm_medium,
    argMinState(utm_campaign, timestamp) AS utm_campaign,
    argMinState(utm_term, timestamp) AS utm_term,
    argMinState(utm_content, timestamp) AS utm_content
FROM analytics.events
GROUP BY site_id, session_created_at, session_id;
