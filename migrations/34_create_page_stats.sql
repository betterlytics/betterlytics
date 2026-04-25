DROP VIEW IF EXISTS analytics.page_stats_mv;
DROP TABLE IF EXISTS analytics.page_stats;

CREATE TABLE IF NOT EXISTS analytics.page_stats (
    site_id LowCardinality(String),
    hour DateTime,
    path String,
    device_type LowCardinality(String),
    browser LowCardinality(String),
    os LowCardinality(String),
    country_code LowCardinality(String),
    visitors_state AggregateFunction(uniq, UInt64),
    pageviews_state SimpleAggregateFunction(sum, UInt64),
    scroll_depth_sum SimpleAggregateFunction(sum, Float64),
    scroll_depth_count SimpleAggregateFunction(sum, UInt64),
    duration_sum SimpleAggregateFunction(sum, UInt64),
    duration_count SimpleAggregateFunction(sum, UInt64)
) ENGINE = AggregatingMergeTree()
PARTITION BY toYYYYMM(hour)
ORDER BY (site_id, hour, path, device_type, browser, os, country_code)
SETTINGS min_rows_for_wide_part = 0, min_bytes_for_wide_part = 0;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.page_stats_mv
TO analytics.page_stats AS
SELECT
    site_id,
    toStartOfHour(timestamp) AS hour,
    url AS path,
    device_type,
    browser,
    os,
    country_code,
    uniqStateIf(session_id, event_type = 'pageview') AS visitors_state,
    countIf(event_type = 'pageview') AS pageviews_state,
    sumIf(toFloat64(assumeNotNull(scroll_depth_percentage)),
          scroll_depth_percentage IS NOT NULL AND event_type = 'engagement') AS scroll_depth_sum,
    countIf(scroll_depth_percentage IS NOT NULL AND event_type = 'engagement') AS scroll_depth_count,
    toUInt64(sumIf(duration_seconds, event_type = 'engagement' AND duration_seconds > 0)) AS duration_sum,
    toUInt64(countIf(event_type = 'engagement' AND duration_seconds > 0)) AS duration_count
FROM analytics.events
WHERE event_type IN ('pageview', 'engagement')
GROUP BY site_id, hour, path, device_type, browser, os, country_code;
