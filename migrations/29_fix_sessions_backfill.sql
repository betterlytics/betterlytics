-- Historical events had session_created_at = their own timestamp (DEFAULT timestamp),
-- so the backfill in migration 28 grouped by (site_id, session_created_at, session_id)
-- and created one row per event instead of one row per session.
-- Fix by truncating and re-backfilling with session_created_at = min(timestamp) per session.

TRUNCATE TABLE IF EXISTS analytics.sessions;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.sessions
SELECT
    site_id,
    min(timestamp) AS session_created_at,
    session_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    countIf(event_type = 'pageview') AS pageview_count,
    argMinState(url, timestamp) AS entry_page,
    argMaxState(url, timestamp) AS exit_page,
    any(visitor_id) AS visitor_id,
    any(domain) AS domain,
    any(device_type) AS device_type,
    any(browser) AS browser,
    any(browser_version) AS browser_version,
    any(os) AS os,
    any(os_version) AS os_version,
    any(country_code) AS country_code,
    any(subdivision_code) AS subdivision_code,
    any(city) AS city,
    argMinState(referrer_source, timestamp) AS referrer_source,
    argMinState(referrer_source_name, timestamp) AS referrer_source_name,
    argMinState(referrer_search_term, timestamp) AS referrer_search_term,
    argMinState(referrer_url, timestamp) AS referrer_url,
    argMinState(utm_source, timestamp) AS utm_source,
    argMinState(utm_medium, timestamp) AS utm_medium,
    argMinState(utm_campaign, timestamp) AS utm_campaign,
    argMinState(utm_term, timestamp) AS utm_term,
    argMinState(utm_content, timestamp) AS utm_content
FROM analytics.events
GROUP BY site_id, session_id;
