-- Migration 26: Add session_created_at to events and session_stats pre-aggregated table
--
-- Problem: getSessionMetrics and getSessionRangeMetrics scan analytics.events twice
-- with a complex 4-CTE query and a +-30-60 minute window expansion to detect session
-- boundaries. This gets progressively slower as data grows.
--
-- Solution: AggregatingMergeTree table fed by a materialized view. One row per
-- session (after ClickHouse background merges) with pre-computed min/max timestamps
-- and pageview count. Session boundary detection moves from query time to insert time.
--
-- Cross-midnight session problem: using toDate(timestamp) as the ORDER BY date column
-- causes sessions spanning UTC midnight to produce rows with different date keys.
-- AggregatingMergeTree can never merge them, forcing inner GROUP BYs session_id at query time.
-- The fix is to store session_created_at (DateTime) in analytics.events, set once by the backend at
-- session creation and never changed. All partial rows for a session share the same
-- session_created_at key regardless of when events arrive, so background merges produce
-- one row per session. Using DateTime (not Date) also enables direct index usage for
-- sub-day queries (last hour, last 30 minutes) without a secondary min_time filter.

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS session_created_at DateTime DEFAULT timestamp;

CREATE TABLE IF NOT EXISTS analytics.session_stats
(
    site_id               LowCardinality(String),
    session_created_at    DateTime,
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
PARTITION BY toYYYYMM(session_created_at)
ORDER BY (site_id, session_created_at, session_id)
TTL session_created_at + toIntervalDay(365);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.session_stats_mv
TO analytics.session_stats
AS
SELECT
    site_id,
    session_created_at,
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
GROUP BY site_id, session_id, session_created_at;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

-- For historical rows, session_created_at = timestamp (the DEFAULT), so
-- min(session_created_at) per session approximates the session start time well enough.
-- New sessions after the backend deploy will have the exact creation time.

INSERT INTO analytics.session_stats
SELECT
    site_id,
    session_created_at,
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
GROUP BY site_id, session_id, session_created_at;
