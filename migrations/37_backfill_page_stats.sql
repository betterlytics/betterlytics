-- Backfill `analytics.page_stats` from `analytics.events` and recreate the
-- MV that was dropped in migration 36 so live events resume capturing.
--
-- Sequence (mirrors the migration 28 backfill pattern):
--   1. TRUNCATE — clears any rows the MV emitted between migration 34
--      (created the MV) and migration 36 (dropped it). The one-shot INSERT
--      below covers the same time range, so no data is lost.
--   2. CREATE MV — resume capturing live inserts from this point on.
--   3. INSERT — historical aggregate over events.
--   4. OPTIMIZE FINAL — force-merge partial aggregates into wide parts.
--
-- Small known overlap: events arriving between step 2 and the SELECT in
-- step 3 are captured by both the MV and the one-shot aggregate. On
-- staging this is a sub-minute window with negligible double-count, and
-- migration 28 (sessions) accepts the same tradeoff.

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

TRUNCATE TABLE analytics.page_stats;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_stats_mv
TO analytics.page_stats AS
SELECT
    site_id,
    toStartOfHour(timestamp) AS hour,
    url                      AS path,
    device_type,
    browser,
    os,
    country_code,
    uniqStateIf(session_id, event_type = 'pageview')                     AS visitors_state,
    countIf(event_type = 'pageview')                                      AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)),
          scroll_depth_percentage IS NOT NULL AND event_type = 'engagement') AS scroll_depth_sum,
    countIf(scroll_depth_percentage IS NOT NULL AND event_type = 'engagement') AS scroll_depth_count,
    toUInt64(sumIf(duration_seconds, event_type = 'engagement' AND duration_seconds > 0)) AS duration_sum,
    toUInt64(countIf(event_type = 'engagement' AND duration_seconds > 0))                  AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'engagement')
GROUP BY site_id, hour, path, device_type, browser, os, country_code;

INSERT INTO analytics.page_stats (
    site_id, hour, path, device_type, browser, os, country_code,
    visitors_state, pageviews_state,
    scroll_depth_sum, scroll_depth_count,
    duration_sum, duration_count
)
SELECT
    site_id,
    toStartOfHour(timestamp) AS hour,
    url AS path,
    device_type, browser, os, country_code,
    uniqStateIf(session_id, event_type = 'pageview'),
    countIf(event_type = 'pageview'),
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)),
          scroll_depth_percentage IS NOT NULL AND event_type = 'engagement'),
    countIf(scroll_depth_percentage IS NOT NULL AND event_type = 'engagement'),
    toUInt64(sumIf(duration_seconds, event_type = 'engagement' AND duration_seconds > 0)),
    toUInt64(countIf(event_type = 'engagement' AND duration_seconds > 0))
FROM analytics.events
WHERE event_type IN ('pageview', 'engagement')
GROUP BY site_id, hour, path, device_type, browser, os, country_code;

OPTIMIZE TABLE analytics.page_stats FINAL;
