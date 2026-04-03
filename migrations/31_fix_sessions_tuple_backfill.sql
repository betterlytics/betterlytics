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
    min(tuple(timestamp, url)) AS entry_page,
    max(tuple(timestamp, url)) AS exit_page,
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
    min(tuple(timestamp, referrer_source)) AS referrer_source,
    min(tuple(timestamp, referrer_source_name)) AS referrer_source_name,
    min(tuple(timestamp, referrer_search_term)) AS referrer_search_term,
    min(tuple(timestamp, referrer_url)) AS referrer_url,
    min(tuple(timestamp, utm_source)) AS utm_source,
    min(tuple(timestamp, utm_medium)) AS utm_medium,
    min(tuple(timestamp, utm_campaign)) AS utm_campaign,
    min(tuple(timestamp, utm_term)) AS utm_term,
    min(tuple(timestamp, utm_content)) AS utm_content
FROM analytics.events
GROUP BY site_id, session_id;
