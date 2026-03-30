-- Migration 26: Add session_stats pre-aggregated table for fast session metrics
--
-- Problem: getSessionMetrics and getSessionRangeMetrics scan analytics.events twice
-- with a complex 4-CTE query and a ±30-60 minute window expansion to detect session
-- boundaries. This gets progressively slower as data grows.
--
-- Solution: AggregatingMergeTree table fed by a materialized view. One row per
-- session (after ClickHouse background merges) with pre-computed min/max timestamps
-- and pageview count. Session boundary detection moves from query time to insert time.
--
-- Sessions spanning midnight (rare): a session's events may be split across two
-- session_start_date values in this table. The query layer handles this by grouping
-- by session_id and using HAVING to filter on min(min_time) for correct attribution.
--
-- Filter support:
--   Session-level filters (country_code, browser, os, device_type, referrer_source,
--   subdivision_code, city, utm_*): stored as SimpleAggregateFunction(any, ...).
--   Stable per session, so any() is deterministic in practice.
--
--   Event-level filters (url, domain, event_type, custom_event_name): require a
--   preliminary DISTINCT session_id lookup from analytics.events before querying
--   this table.

CREATE TABLE IF NOT EXISTS analytics.session_stats
(
    site_id               LowCardinality(String),
    session_start_date    Date,
    session_id            String,
    domain                SimpleAggregateFunction(any, String),
    country_code          SimpleAggregateFunction(any, Nullable(String)),
    subdivision_code      SimpleAggregateFunction(any, String),
    city                  SimpleAggregateFunction(any, String),
    browser               SimpleAggregateFunction(any, String),
    browser_version       SimpleAggregateFunction(any, String),
    os                    SimpleAggregateFunction(any, String),
    os_version            SimpleAggregateFunction(any, String),
    device_type           SimpleAggregateFunction(any, String),
    referrer_source       SimpleAggregateFunction(any, String),
    referrer_source_name  SimpleAggregateFunction(any, String),
    referrer_search_term  SimpleAggregateFunction(any, String),
    referrer_url          SimpleAggregateFunction(any, String),
    utm_source            SimpleAggregateFunction(any, String),
    utm_medium            SimpleAggregateFunction(any, String),
    utm_campaign          SimpleAggregateFunction(any, String),
    utm_term              SimpleAggregateFunction(any, String),
    utm_content           SimpleAggregateFunction(any, String),
    entry_page            AggregateFunction(argMin, String, DateTime),
    exit_page             AggregateFunction(argMax, String, DateTime),
    min_time              SimpleAggregateFunction(min, DateTime),
    max_time              SimpleAggregateFunction(max, DateTime),
    page_count            SimpleAggregateFunction(sum, UInt64)
)
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(session_start_date)
ORDER BY (site_id, session_start_date, session_id)
TTL session_start_date + toIntervalDay(365);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.session_stats_mv
TO analytics.session_stats
AS
SELECT
    site_id,
    toDate(timestamp)                               AS session_start_date,
    session_id,
    any(domain)                                     AS domain,
    any(country_code)                               AS country_code,
    any(subdivision_code)                           AS subdivision_code,
    any(city)                                       AS city,
    any(browser)                                    AS browser,
    any(browser_version)                            AS browser_version,
    any(os)                                         AS os,
    any(os_version)                                 AS os_version,
    any(device_type)                                AS device_type,
    any(referrer_source)                            AS referrer_source,
    any(referrer_source_name)                       AS referrer_source_name,
    any(referrer_search_term)                       AS referrer_search_term,
    any(referrer_url)                               AS referrer_url,
    any(utm_source)                                 AS utm_source,
    any(utm_medium)                                 AS utm_medium,
    any(utm_campaign)                               AS utm_campaign,
    any(utm_term)                                   AS utm_term,
    any(utm_content)                                AS utm_content,
    argMinState(url, timestamp)                     AS entry_page,
    argMaxState(url, timestamp)                     AS exit_page,
    min(timestamp)                                  AS min_time,
    max(timestamp)                                  AS max_time,
    sumIf(toUInt64(1), event_type = 'pageview')     AS page_count
FROM analytics.events
GROUP BY site_id, session_id, toDate(timestamp);

-- Backfill historical data from existing events.
-- This may take several minutes on large datasets.
SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.session_stats
SELECT
    site_id,
    toDate(timestamp)                               AS session_start_date,
    session_id,
    any(domain)                                     AS domain,
    any(country_code)                               AS country_code,
    any(subdivision_code)                           AS subdivision_code,
    any(city)                                       AS city,
    any(browser)                                    AS browser,
    any(browser_version)                            AS browser_version,
    any(os)                                         AS os,
    any(os_version)                                 AS os_version,
    any(device_type)                                AS device_type,
    any(referrer_source)                            AS referrer_source,
    any(referrer_source_name)                       AS referrer_source_name,
    any(referrer_search_term)                       AS referrer_search_term,
    any(referrer_url)                               AS referrer_url,
    any(utm_source)                                 AS utm_source,
    any(utm_medium)                                 AS utm_medium,
    any(utm_campaign)                               AS utm_campaign,
    any(utm_term)                                   AS utm_term,
    any(utm_content)                                AS utm_content,
    argMinState(url, timestamp)                     AS entry_page,
    argMaxState(url, timestamp)                     AS exit_page,
    min(timestamp)                                  AS min_time,
    max(timestamp)                                  AS max_time,
    sumIf(toUInt64(1), event_type = 'pageview')     AS page_count
FROM analytics.events
GROUP BY site_id, session_id, toDate(timestamp);
