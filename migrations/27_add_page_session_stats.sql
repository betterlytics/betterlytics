-- Migration 27: Add page_session_stats pre-aggregated table for fast page metrics
--
-- Problem: getPageMetrics, getDailyAverageTimeOnPage, getEntryPageAnalytics, and
-- getExitPageAnalytics all use leadInFrame window functions with multiple full
-- analytics.events scans, making them progressively slower as data grows.
--
-- Solution: AggregatingMergeTree table fed by a materialized view. One row per
-- (session, url, page_date) after ClickHouse background merges, with pre-computed
-- min/max timestamps across ALL event types (pageviews, scroll_depth, CWV events).
-- This gives accurate engagement time: max(timestamp) - min(timestamp) per (session,
-- url) captures the full time a visitor was on the page, including scroll and CWV
-- events. No leadInFrame needed and no NULL last-page problem.
--
-- Why ALL event types: a visitor may not navigate to another page (last page of
-- session), so leadInFrame would return NULL. By using all event types including
-- scroll_depth and CWV as signals of activity, we get a lower bound on engagement
-- time that is both accurate and pre-computable incrementally.
--
-- Cross-day sessions: a session spanning midnight may produce rows with different
-- page_date values for the same (session, url). Query layer handles this by using
-- HAVING on min(min_time) after GROUP BY session_id, url.
--
-- Filter support:
--   Session-level filters (country, browser, etc.): route through session_stats.
--   Event-level filters (url, event_type, custom_event_name): apply as WHERE on
--   page_session_stats.url or as session_id IN subquery from analytics.events.

CREATE TABLE IF NOT EXISTS analytics.page_session_stats
(
    site_id          LowCardinality(String),
    page_date        Date,
    session_id       String,
    url              String,
    min_time         SimpleAggregateFunction(min, DateTime),
    max_time         SimpleAggregateFunction(max, DateTime),
    pageview_count   SimpleAggregateFunction(sum, UInt64),
    max_scroll_depth SimpleAggregateFunction(max, Nullable(Float32))
)
ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(page_date)
ORDER BY (site_id, page_date, url, session_id)
TTL page_date + toIntervalDay(365);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_session_stats_mv
TO analytics.page_session_stats
AS
SELECT
    site_id,
    toDate(timestamp)                                                AS page_date,
    session_id,
    url,
    min(timestamp)                                                   AS min_time,
    max(timestamp)                                                   AS max_time,
    sumIf(toUInt64(1), event_type = 'pageview')                      AS pageview_count,
    maxIf(scroll_depth_percentage, event_type = 'scroll_depth')      AS max_scroll_depth
FROM analytics.events
GROUP BY site_id, session_id, url, toDate(timestamp);

-- Backfill historical data from existing events.
-- This may take several minutes on large datasets.
SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.page_session_stats
SELECT
    site_id,
    toDate(timestamp)                                                AS page_date,
    session_id,
    url,
    min(timestamp)                                                   AS min_time,
    max(timestamp)                                                   AS max_time,
    sumIf(toUInt64(1), event_type = 'pageview')                      AS pageview_count,
    maxIf(scroll_depth_percentage, event_type = 'scroll_depth')      AS max_scroll_depth
FROM analytics.events
GROUP BY site_id, session_id, url, toDate(timestamp);
