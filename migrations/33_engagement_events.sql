-- Combining duration + scroll depth into a single event type (engagement).
--
-- Previously scroll_depth was a separate event. Now the client sends one `engagement` event
-- per page visit containing both duration and scroll depth. This:
--   - Eliminates a separate network request per page leave
--   - Removes the need for leadInFrame window functions at query time
--
-- Backfill strategy for production:
--   - Synthetic engagement events are inserted from existing pageview timestamps (leadInFrame
--     for duration) and existing scroll_depth events (for scroll percentage).

-- Add engagement = 7 to event_type enum (scroll_depth = 5 kept for legacy data)
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

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS page_duration_seconds UInt32 DEFAULT 0;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

-- Insert synthetic engagement events for all historical pageviews.
-- Duration: leadInFrame gap to the next pageview in the session, capped at 1800s.
-- Scroll: per-pageview-instance attribution. A legacy scroll_depth event at time t
-- belongs to the pv-instance where t in [pv.timestamp, pv.next_ts), matching forward
-- ingestion (one engagement per pv-instance carrying the scroll reached during that
-- visit).
-- Synthetic rows are written at `pv.timestamp + 1 second` so they sort after their
-- source pageview on equal timestamps.
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
    global_properties_keys,
    global_properties_values,
    page_duration_seconds
)
WITH
    pv_with_window AS (
        SELECT
            site_id, visitor_id, session_id, domain, url,
            device_type, country_code, subdivision_code, city,
            timestamp, date,
            browser, browser_version, os, os_version,
            referrer_source, referrer_source_name, referrer_search_term, referrer_url,
            utm_source, utm_medium, utm_campaign, utm_term, utm_content,
            session_created_at,
            global_properties_keys,
            global_properties_values,
            leadInFrame(timestamp) OVER (
                PARTITION BY site_id, session_id
                ORDER BY timestamp
                ROWS BETWEEN CURRENT ROW AND 1 FOLLOWING
            ) AS next_ts,
            if(
                next_ts > timestamp
                    AND dateDiff('second', timestamp, next_ts) <= 1800,
                toUInt32(dateDiff('second', timestamp, next_ts)),
                0
            ) AS computed_duration
        FROM analytics.events
        WHERE event_type = 'pageview'
    ),
    scroll_per_pv AS (
        SELECT
            pv.site_id                      AS site_id,
            pv.session_id                   AS session_id,
            pv.url                          AS url,
            pv.timestamp                    AS pv_timestamp,
            max(sd.scroll_depth_percentage) AS scroll_depth_percentage,
            max(sd.scroll_depth_pixels)     AS scroll_depth_pixels
        FROM pv_with_window pv
        INNER JOIN (
            SELECT site_id, session_id, url, timestamp,
                scroll_depth_percentage, scroll_depth_pixels
            FROM analytics.events
            WHERE event_type = 'scroll_depth'
        ) sd
            ON  pv.site_id    = sd.site_id
            AND pv.session_id = sd.session_id
            AND pv.url        = sd.url
        WHERE sd.timestamp >= pv.timestamp 
            AND (pv.next_ts <= pv.timestamp OR sd.timestamp < pv.next_ts)
        GROUP BY pv.site_id, pv.session_id, pv.url, pv.timestamp
    )
SELECT
    pv.site_id, pv.visitor_id, pv.session_id, pv.domain, pv.url,
    pv.device_type, pv.country_code, pv.subdivision_code, pv.city,
    pv.timestamp + INTERVAL 1 SECOND                         AS timestamp,
    toDate(pv.timestamp + INTERVAL 1 SECOND)                 AS date,
    pv.browser, pv.browser_version, pv.os, pv.os_version,
    pv.referrer_source, pv.referrer_source_name, pv.referrer_search_term, pv.referrer_url,
    pv.utm_source, pv.utm_medium, pv.utm_campaign, pv.utm_term, pv.utm_content,
    'engagement'        AS event_type,
    ''                  AS custom_event_name,
    ''                  AS custom_event_json,
    ''                  AS outbound_link_url,
    NULL AS cwv_cls, NULL AS cwv_lcp, NULL AS cwv_inp, NULL AS cwv_fcp, NULL AS cwv_ttfb,
    sp.scroll_depth_percentage,
    sp.scroll_depth_pixels,
    '' AS error_exceptions, '' AS error_type, '' AS error_message, '' AS error_fingerprint,
    pv.session_created_at,
    pv.global_properties_keys,
    pv.global_properties_values,
    pv.computed_duration                                     AS page_duration_seconds
FROM pv_with_window pv
LEFT JOIN scroll_per_pv sp
    ON  pv.site_id    = sp.site_id
    AND pv.session_id = sp.session_id
    AND pv.url        = sp.url
    AND pv.timestamp  = sp.pv_timestamp
WHERE pv.computed_duration > 0 OR sp.scroll_depth_percentage IS NOT NULL;

-- Rebuild billing MV with whitelist
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

INSERT INTO analytics.usage_by_site_daily
SELECT
    site_id,
    toDate(timestamp) AS date,
    count()           AS event_count
FROM analytics.events
WHERE event_type IN ('pageview', 'custom', 'outbound_link', 'cwv', 'client_error')
GROUP BY site_id, date;
