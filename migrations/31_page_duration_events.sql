-- Introduces page_duration events and consolidates page_stats into a single MV.
--
-- Key changes:
--   1. Add page_duration = 7 to event_type enum
--   2. Add duration UInt32 column to events
--   3. Backfill synthetic page_duration events from historical pageviews using leadInFrame
--      so the non-MV query path and MV path use identical data
--   4. Rebuild billing MV with allowlist (pageview, custom, outbound_link, cwv, client_error)
--      instead of denylist
--   5. Recreate page_stats with a single MV covering all event types under the same url key

-- Step 1: Extend event_type enum
ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8(
        'pageview' = 1,
        'custom' = 2,
        'outbound_link' = 3,
        'cwv' = 4,
        'scroll_depth' = 5,
        'client_error' = 6,
        'page_duration' = 7
    );

-- Step 2: Add duration column
ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS duration UInt32 DEFAULT 0;

-- Step 3: Backfill synthetic page_duration events into analytics.events
-- Duration = gap to next pageview in same session, capped at 1800s (30-min idle timeout).
-- Using the pageview's timestamp so events land in the correct hourly bucket.
-- All non-duration columns copied from the source pageview row.
INSERT INTO analytics.events (
    site_id, visitor_id, session_id, domain, url,
    device_type, country_code, subdivision_code, city,
    timestamp, date,
    browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    event_type,
    custom_event_name, custom_event_json, outbound_link_url,
    cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
    scroll_depth_percentage, scroll_depth_pixels,
    error_exceptions, error_type, error_message, error_fingerprint,
    session_created_at,
    duration
)
SELECT
    site_id, visitor_id, session_id, domain, url,
    device_type, country_code, subdivision_code, city,
    timestamp, date,
    browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    'page_duration' AS event_type,
    ''  AS custom_event_name,
    ''  AS custom_event_json,
    ''  AS outbound_link_url,
    NULL AS cwv_cls, NULL AS cwv_lcp, NULL AS cwv_inp, NULL AS cwv_fcp, NULL AS cwv_ttfb,
    NULL AS scroll_depth_percentage, NULL AS scroll_depth_pixels,
    ''  AS error_exceptions, '' AS error_type, '' AS error_message, '' AS error_fingerprint,
    session_created_at,
    computed_duration AS duration
FROM (
    SELECT
        site_id, visitor_id, session_id, domain, url,
        device_type, country_code, subdivision_code, city,
        timestamp, date,
        browser, browser_version, os, os_version,
        referrer_source, referrer_source_name, referrer_search_term, referrer_url,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        session_created_at,
        if(
            next_ts > timestamp
                AND dateDiff('second', timestamp, next_ts) <= 1800,
            toUInt32(dateDiff('second', timestamp, next_ts)),
            0
        ) AS computed_duration
    FROM (
        SELECT
            site_id, visitor_id, session_id, domain, url,
            device_type, country_code, subdivision_code, city,
            timestamp, date,
            browser, browser_version, os, os_version,
            referrer_source, referrer_source_name, referrer_search_term, referrer_url,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            session_created_at,
            leadInFrame(timestamp) OVER (
                PARTITION BY site_id, session_id
                ORDER BY timestamp
                ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING
            ) AS next_ts
        FROM analytics.events
        WHERE event_type = 'pageview'
    )
)
WHERE computed_duration > 0;

-- Step 4: Rebuild billing MV with allowlist
DROP VIEW IF EXISTS analytics.usage_by_site_daily;

CREATE MATERIALIZED VIEW analytics.usage_by_site_daily
ENGINE = SummingMergeTree()
ORDER BY (site_id, date)
AS SELECT
    site_id,
    toDate(timestamp) AS date,
    count()           AS event_count
FROM analytics.events
WHERE event_type IN ('pageview', 'custom', 'outbound_link', 'cwv', 'client_error')
GROUP BY site_id, date;

-- Backfill billing MV
INSERT INTO analytics.usage_by_site_daily
SELECT
    site_id,
    toDate(timestamp) AS date,
    count()           AS event_count
FROM analytics.events
WHERE event_type IN ('pageview', 'custom', 'outbound_link', 'cwv', 'client_error')
GROUP BY site_id, date;

-- Step 5: Recreate page_stats
DROP VIEW IF EXISTS analytics.page_stats_events_mv;
DROP VIEW IF EXISTS analytics.page_stats_duration_mv;
DROP TABLE IF EXISTS analytics.page_stats;

CREATE TABLE IF NOT EXISTS analytics.page_stats
(
    site_id             LowCardinality(String),
    hour                DateTime,
    path                String,
    visitors_state      AggregateFunction(uniq, UInt64),
    pageviews_state     SimpleAggregateFunction(sum, UInt64),
    scroll_depth_sum    SimpleAggregateFunction(sum, Float64),
    scroll_depth_count  SimpleAggregateFunction(sum, UInt64),
    duration_sum        SimpleAggregateFunction(sum, UInt64),
    duration_count      SimpleAggregateFunction(sum, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (site_id, hour, path);

-- Single MV: all event types share the same url key
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_stats_mv
TO analytics.page_stats AS
SELECT
    site_id,
    toStartOfHour(timestamp)                                                                AS hour,
    url                                                                                     AS path,
    uniqStateIf(session_id, event_type = 'pageview')                                       AS visitors_state,
    countIf(event_type = 'pageview')                                                        AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)), event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) AS scroll_depth_sum,
    countIf(event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL)            AS scroll_depth_count,
    toUInt64(sumIf(duration, event_type = 'page_duration' AND duration > 0))               AS duration_sum,
    toUInt64(countIf(event_type = 'page_duration' AND duration > 0))                       AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'scroll_depth', 'page_duration')
GROUP BY site_id, hour, path;

-- Backfill page_stats from events
INSERT INTO analytics.page_stats (site_id, hour, path, visitors_state, pageviews_state, scroll_depth_sum, scroll_depth_count, duration_sum, duration_count)
SELECT
    site_id,
    toStartOfHour(timestamp)                                                                AS hour,
    url                                                                                     AS path,
    uniqStateIf(session_id, event_type = 'pageview')                                       AS visitors_state,
    countIf(event_type = 'pageview')                                                        AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)), event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) AS scroll_depth_sum,
    countIf(event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL)            AS scroll_depth_count,
    toUInt64(sumIf(duration, event_type = 'page_duration' AND duration > 0))               AS duration_sum,
    toUInt64(countIf(event_type = 'page_duration' AND duration > 0))                       AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'scroll_depth', 'page_duration')
GROUP BY site_id, hour, path;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

OPTIMIZE TABLE analytics.page_stats FINAL;
