-- Backfill `engagement` events from existing pageviews.
--
-- For each historical pageview we synthesize an engagement row carrying:
--   - duration_seconds = gap to the next pageview in the same session via
--     leadInFrame(), capped at the 1800s session-idle timeout. Tail
--     pageviews (no next) get 0; the query layer's `duration_seconds > 0`
--     gate excludes those from time-on-page averages.
--   - scroll_depth_percentage / scroll_depth_pixels = session-max joined
--     from any legacy `scroll_depth` rows for the same (site, session, url).
-- See refined-pages-optimization-design.md §6.1.4 for semantic notes.

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

-- Pause the page_stats MV during the backfill. Otherwise the engagement-only
-- INSERT block would emit half-rows (visitors_state empty, pageviews_state=0,
-- scroll/duration filled) into page_stats, double-counting against migration
-- 37's one-shot aggregate. Migration 37 recreates the MV.
DROP VIEW IF EXISTS analytics.page_stats_mv;

INSERT INTO analytics.events (
    site_id, visitor_id, session_id, domain, url,
    device_type, country_code, subdivision_code, city,
    timestamp, date,
    browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    event_type, custom_event_name, custom_event_json, outbound_link_url,
    cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
    scroll_depth_percentage, scroll_depth_pixels,
    error_exceptions, error_type, error_message, error_fingerprint,
    session_created_at, global_properties_keys, global_properties_values,
    duration_seconds
)
SELECT
    pv.site_id, pv.visitor_id, pv.session_id, pv.domain, pv.url,
    pv.device_type, pv.country_code, pv.subdivision_code, pv.city,
    pv.timestamp + INTERVAL 1 SECOND AS timestamp,
    toDate(pv.timestamp + INTERVAL 1 SECOND) AS date,
    pv.browser, pv.browser_version, pv.os, pv.os_version,
    pv.referrer_source, pv.referrer_source_name, pv.referrer_search_term, pv.referrer_url,
    pv.utm_source, pv.utm_medium, pv.utm_campaign, pv.utm_term, pv.utm_content,
    'engagement' AS event_type,
    '' AS custom_event_name, '' AS custom_event_json, '' AS outbound_link_url,
    NULL, NULL, NULL, NULL, NULL,
    sd.scroll_depth_percentage,
    sd.scroll_depth_pixels,
    '' AS error_exceptions, '' AS error_type, '' AS error_message, '' AS error_fingerprint,
    pv.session_created_at,
    CAST([] AS Array(String)) AS global_properties_keys,
    CAST([] AS Array(String)) AS global_properties_values,
    pv.computed_duration_seconds AS duration_seconds
FROM (
    SELECT
        site_id, visitor_id, session_id, domain, url,
        device_type, country_code, subdivision_code, city,
        timestamp,
        browser, browser_version, os, os_version,
        referrer_source, referrer_source_name, referrer_search_term, referrer_url,
        utm_source, utm_medium, utm_campaign, utm_term, utm_content,
        session_created_at,
        if(
            next_ts > timestamp
                AND dateDiff('second', timestamp, next_ts) <= 1800,
            toUInt32(dateDiff('second', timestamp, next_ts)),
            0
        ) AS computed_duration_seconds
    FROM (
        SELECT *,
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
    SELECT site_id, session_id, url,
           max(scroll_depth_percentage) AS scroll_depth_percentage,
           max(scroll_depth_pixels)     AS scroll_depth_pixels
    FROM analytics.events
    WHERE event_type = 'scroll_depth'
    GROUP BY site_id, session_id, url
) sd USING (site_id, session_id, url);
