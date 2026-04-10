-- Combining duration + scroll depth into a single event type (engagement).
--
-- Previously scroll_depth was a separate event. Now the client sends one `engagement` event
-- per page visit containing both duration and scroll depth. This:
--   - Eliminates a separate network request per page leave
--   - Allows a single MV to aggregate both metrics under the same url key
--   - Removes the need for leadInFrame window functions at query time
--
-- Backfill strategy for production:
--   - Synthetic engagement events are inserted from existing pageview timestamps (leadInFrame
--     for duration) and existing scroll_depth events (for scroll percentage).
--     After backfill both the MV path and the non-MV fallback read only engagement events.
--   - Billing MV is rebuilt with a whitelist instead of blacklist.

-- Step 1: Add engagement = 7 to event_type enum (scroll_depth = 5 kept for legacy data)
ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8(
        'pageview' = 1,
        'custom' = 2,
        'outbound_link' = 3,
        'cwv' = 4,
        'scroll_depth' = 5,
        'client_error' = 6,
        'engagement' = 7
    );

-- Step 2: Add duration column
ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS duration UInt32 DEFAULT 0;

-- Step 3: Insert synthetic engagement events for all historical pageviews.
-- Duration computed via leadInFrame (gap to next pageview in session, capped at 1800s).
-- Scroll depth joined from the last scroll_depth event for the same (site_id, session_id, url).
-- After this insert both MV and non-MV paths read engagement events.
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
    pv.site_id, pv.visitor_id, pv.session_id, pv.domain, pv.url,
    pv.device_type, pv.country_code, pv.subdivision_code, pv.city,
    pv.timestamp, pv.date,
    pv.browser, pv.browser_version, pv.os, pv.os_version,
    pv.referrer_source, pv.referrer_source_name, pv.referrer_search_term, pv.referrer_url,
    pv.utm_source, pv.utm_medium, pv.utm_campaign, pv.utm_term, pv.utm_content,
    'engagement'        AS event_type,
    ''                  AS custom_event_name,
    ''                  AS custom_event_json,
    ''                  AS outbound_link_url,
    NULL AS cwv_cls, NULL AS cwv_lcp, NULL AS cwv_inp, NULL AS cwv_fcp, NULL AS cwv_ttfb,
    sd.scroll_depth_percentage,
    sd.scroll_depth_pixels,
    '' AS error_exceptions, '' AS error_type, '' AS error_message, '' AS error_fingerprint,
    pv.session_created_at,
    pv.computed_duration AS duration
FROM (
    -- Pageviews with leadInFrame duration
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
) pv
LEFT JOIN (
    -- Max scroll depth per (site_id, session_id, url) from legacy scroll_depth events
    SELECT
        site_id,
        session_id,
        url,
        maxIf(scroll_depth_percentage, scroll_depth_percentage IS NOT NULL) AS scroll_depth_percentage,
        maxIf(scroll_depth_pixels,     scroll_depth_pixels IS NOT NULL)     AS scroll_depth_pixels
    FROM analytics.events
    WHERE event_type = 'scroll_depth'
    GROUP BY site_id, session_id, url
) sd ON pv.site_id = sd.site_id AND pv.session_id = sd.session_id AND pv.url = sd.url
WHERE pv.computed_duration > 0 OR sd.scroll_depth_percentage IS NOT NULL;

-- Step 4: Rebuild billing MV with whitelist
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

-- Backfill billing
INSERT INTO analytics.usage_by_site_daily
SELECT
    site_id,
    toDate(timestamp) AS date,
    count()           AS event_count
FROM analytics.events
WHERE event_type IN ('pageview', 'custom', 'outbound_link', 'cwv', 'client_error')
GROUP BY site_id, date;

-- Step 5: Recreate page_stats with single MV
-- engagement covers both duration and scroll depth under the same url key.
-- Legacy scroll_depth events (pre-migration) are still included for scroll aggregation.
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

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_stats_mv
TO analytics.page_stats AS
SELECT
    site_id,
    toStartOfHour(timestamp)                                                                 AS hour,
    url                                                                                      AS path,
    uniqStateIf(session_id, event_type = 'pageview')                                        AS visitors_state,
    countIf(event_type = 'pageview')                                                         AS pageviews_state,
    -- scroll depth: engagement events (new) + legacy scroll_depth events (pre-migration)
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)),
        scroll_depth_percentage IS NOT NULL
        AND event_type IN ('engagement', 'scroll_depth'))                                    AS scroll_depth_sum,
    countIf(scroll_depth_percentage IS NOT NULL
        AND event_type IN ('engagement', 'scroll_depth'))                                    AS scroll_depth_count,
    toUInt64(sumIf(duration, event_type = 'engagement' AND duration > 0))                   AS duration_sum,
    toUInt64(countIf(event_type = 'engagement' AND duration > 0))                           AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'scroll_depth', 'engagement')
GROUP BY site_id, hour, path;

-- Backfill page_stats from all events (engagement rows inserted above are already in the table)
INSERT INTO analytics.page_stats (site_id, hour, path, visitors_state, pageviews_state, scroll_depth_sum, scroll_depth_count, duration_sum, duration_count)
SELECT
    site_id,
    toStartOfHour(timestamp)                                                                 AS hour,
    url                                                                                      AS path,
    uniqStateIf(session_id, event_type = 'pageview')                                        AS visitors_state,
    countIf(event_type = 'pageview')                                                         AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)),
        scroll_depth_percentage IS NOT NULL
        AND event_type IN ('engagement', 'scroll_depth'))                                    AS scroll_depth_sum,
    countIf(scroll_depth_percentage IS NOT NULL
        AND event_type IN ('engagement', 'scroll_depth'))                                    AS scroll_depth_count,
    toUInt64(sumIf(duration, event_type = 'engagement' AND duration > 0))                   AS duration_sum,
    toUInt64(countIf(event_type = 'engagement' AND duration > 0))                           AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'scroll_depth', 'engagement')
GROUP BY site_id, hour, path;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

OPTIMIZE TABLE analytics.page_stats FINAL;
