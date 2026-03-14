CREATE TABLE IF NOT EXISTS analytics.sessions
(
    site_id String,
    session_id String,
    visitor_id SimpleAggregateFunction(any, String),
    session_start SimpleAggregateFunction(min, DateTime),
    session_end SimpleAggregateFunction(max, DateTime),
    pageview_count SimpleAggregateFunction(sum, UInt64),
    device_type SimpleAggregateFunction(any, LowCardinality(String)),
    country_code SimpleAggregateFunction(any, LowCardinality(Nullable(String))),
    browser SimpleAggregateFunction(any, LowCardinality(String)),
    os SimpleAggregateFunction(any, LowCardinality(String)),
    referrer_source SimpleAggregateFunction(any, String),
    referrer_source_name SimpleAggregateFunction(any, String),
    referrer_url SimpleAggregateFunction(any, String),
    utm_source SimpleAggregateFunction(max, String),
    utm_medium SimpleAggregateFunction(max, String),
    utm_campaign SimpleAggregateFunction(max, String),
    utm_term SimpleAggregateFunction(max, String),
    utm_content SimpleAggregateFunction(max, String)
)
ENGINE = AggregatingMergeTree()
ORDER BY (site_id, session_id)
SETTINGS index_granularity = 8192;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.sessions_mv TO analytics.sessions AS
SELECT
    site_id,
    session_id,
    visitor_id,
    timestamp AS session_start,
    timestamp AS session_end,
    toUInt64(1) AS pageview_count,
    device_type,
    country_code,
    browser,
    os,
    referrer_source,
    referrer_source_name,
    referrer_url,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
FROM analytics.events
WHERE event_type = 'pageview';

INSERT INTO analytics.sessions
SETTINGS max_execution_time = 0
SELECT
    site_id,
    session_id,
    any(visitor_id) AS visitor_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    count() AS pageview_count,
    any(device_type) AS device_type,
    any(country_code) AS country_code,
    any(browser) AS browser,
    any(os) AS os,
    any(referrer_source) AS referrer_source,
    any(referrer_source_name) AS referrer_source_name,
    any(referrer_url) AS referrer_url,
    max(utm_source) AS utm_source,
    max(utm_medium) AS utm_medium,
    max(utm_campaign) AS utm_campaign,
    max(utm_term) AS utm_term,
    max(utm_content) AS utm_content
FROM analytics.events
WHERE event_type = 'pageview'
GROUP BY site_id, session_id;
