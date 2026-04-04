-- Create page_stats AggregatingMergeTree with hourly granularity.
-- Hourly buckets support all sub-day query ranges (last hour, last 6h, last 12h).
-- Realtime queries (< 1 hour range) fall back to raw events in application code.
-- Timezone conversion happens at query time; UTC stored here.

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

-- MV 1: visitors, pageviews, scroll_depth — keyed by current page url
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_stats_events_mv
TO analytics.page_stats AS
SELECT
    site_id,
    toStartOfHour(timestamp)                                                               AS hour,
    url                                                                                    AS path,
    uniqStateIf(session_id, event_type = 'pageview')                                      AS visitors_state,
    countIf(event_type = 'pageview')                                                       AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)), event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) AS scroll_depth_sum,
    countIf(event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL)           AS scroll_depth_count
FROM analytics.events
WHERE event_type IN ('pageview', 'scroll_depth')
GROUP BY site_id, hour, path;

-- MV 2: avg time on page — keyed by prev_url (the page that was left)
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_stats_duration_mv
TO analytics.page_stats AS
SELECT
    site_id,
    toStartOfHour(timestamp)                      AS hour,
    prev_url                                      AS path,
    toUInt64(sum(prev_pageview_duration))         AS duration_sum,
    toUInt64(count())                             AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'pagehide')
  AND prev_url != ''
  AND prev_pageview_duration IS NOT NULL
GROUP BY site_id, hour, path;

-- Backfill: visitors, pageviews, scroll_depth
INSERT INTO analytics.page_stats (site_id, hour, path, visitors_state, pageviews_state, scroll_depth_sum, scroll_depth_count)
SELECT
    site_id,
    toStartOfHour(timestamp)                                                               AS hour,
    url                                                                                    AS path,
    uniqStateIf(session_id, event_type = 'pageview')                                      AS visitors_state,
    countIf(event_type = 'pageview')                                                       AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)), event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL) AS scroll_depth_sum,
    countIf(event_type = 'scroll_depth' AND scroll_depth_percentage IS NOT NULL)           AS scroll_depth_count
FROM analytics.events
WHERE event_type IN ('pageview', 'scroll_depth')
GROUP BY site_id, hour, path;

-- Backfill: duration for events that have prev_pageview_duration (post migration 33)
INSERT INTO analytics.page_stats (site_id, hour, path, duration_sum, duration_count)
SELECT
    site_id,
    toStartOfHour(timestamp)              AS hour,
    prev_url                              AS path,
    toUInt64(sum(prev_pageview_duration)) AS duration_sum,
    toUInt64(count())                     AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'pagehide')
  AND prev_url != ''
  AND prev_pageview_duration IS NOT NULL
GROUP BY site_id, hour, path;

-- Backfill: duration for historical events that predate prev_pageview_duration tracking.
-- Uses leadInFrame to compute time-on-page from the next pageview in the same session,
-- equivalent to what the new tracking stores as prev_pageview_duration.
-- Capped at 1800s (30-min session idle timeout) to match live tracking behaviour.
INSERT INTO analytics.page_stats (site_id, hour, path, duration_sum, duration_count)
SELECT
    site_id,
    toStartOfHour(timestamp) AS hour,
    url                       AS path,
    toUInt64(sum(duration))   AS duration_sum,
    toUInt64(count())         AS duration_count
FROM (
    SELECT
        site_id,
        timestamp,
        url,
        if(
            next_ts > timestamp
                AND dateDiff('second', timestamp, next_ts) <= 1800,
            dateDiff('second', timestamp, next_ts),
            0
        ) AS duration
    FROM (
        SELECT
            site_id,
            timestamp,
            url,
            leadInFrame(timestamp) OVER (
                PARTITION BY site_id, session_id
                ORDER BY timestamp
                ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING
            ) AS next_ts
        FROM analytics.events
        WHERE event_type = 'pageview'
          AND prev_pageview_duration IS NULL
    )
)
WHERE duration > 0
GROUP BY site_id, hour, path;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

OPTIMIZE TABLE analytics.page_stats FINAL;
