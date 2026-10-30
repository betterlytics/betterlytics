SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

ALTER TABLE analytics.events
    UPDATE country_code = 'NO', subdivision_code = replaceRegexpOne(subdivision_code, '^SJ-', 'NO-')
    WHERE country_code = 'SJ'
    SETTINGS mutations_sync = 2;

ALTER TABLE analytics.sessions
    UPDATE country_code = 'NO', subdivision_code = replaceRegexpOne(subdivision_code, '^SJ-', 'NO-')
    WHERE country_code = 'SJ'
    SETTINGS mutations_sync = 2;

-- Rollup keys cannot be updated, so rows are copied under NO and then deleted; a re-run is safe only because uniq states merge idempotently
INSERT INTO analytics.geo_hourly
SELECT site_id, hour, 'NO', replaceRegexpOne(subdivision_code, '^SJ-', 'NO-'), city, visitors
FROM analytics.geo_hourly
WHERE country_code = 'SJ';

ALTER TABLE analytics.geo_hourly
    DELETE WHERE country_code = 'SJ'
    SETTINGS mutations_sync = 2;

INSERT INTO analytics.overview_hourly
SELECT site_id, hour, device_type, browser, os, 'NO', visitors
FROM analytics.overview_hourly
WHERE country_code = 'SJ';

ALTER TABLE analytics.overview_hourly
    DELETE WHERE country_code = 'SJ'
    SETTINGS mutations_sync = 2;
