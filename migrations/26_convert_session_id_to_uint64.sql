CREATE TABLE IF NOT EXISTS analytics.events_new (
    site_id LowCardinality(String),
    visitor_id UInt64,
    session_id UInt64,
    domain LowCardinality(String) DEFAULT '',
    url String,
    device_type LowCardinality(String),
    country_code LowCardinality(Nullable(String)),
    subdivision_code LowCardinality(String) DEFAULT '',
    city LowCardinality(String) DEFAULT '',
    timestamp DateTime,
    date Date DEFAULT toDate(timestamp),
    browser LowCardinality(String) DEFAULT '',
    browser_version LowCardinality(String) DEFAULT '',
    os LowCardinality(String) DEFAULT '',
    os_version LowCardinality(String) DEFAULT '',
    referrer_source LowCardinality(String) DEFAULT 'direct',
    referrer_source_name String DEFAULT '',
    referrer_search_term String DEFAULT '',
    referrer_url String DEFAULT '',
    utm_source String DEFAULT '',
    utm_medium String DEFAULT '',
    utm_campaign String DEFAULT '',
    utm_term String DEFAULT '',
    utm_content String DEFAULT '',
    event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3, 'cwv' = 4, 'scroll_depth' = 5, 'client_error' = 6),
    custom_event_name String DEFAULT '',
    custom_event_json String DEFAULT '{}',
    outbound_link_url String DEFAULT '',
    cwv_cls Nullable(Float32),
    cwv_lcp Nullable(Float32),
    cwv_inp Nullable(Float32),
    cwv_fcp Nullable(Float32),
    cwv_ttfb Nullable(Float32),
    scroll_depth_percentage Nullable(Float32),
    scroll_depth_pixels Nullable(Float32),
    error_exceptions String DEFAULT '',
    error_type LowCardinality(String) DEFAULT '',
    error_message String DEFAULT '',
    error_fingerprint String DEFAULT '',

    INDEX visitor_idx visitor_id TYPE bloom_filter GRANULARITY 3,
    INDEX session_idx session_id TYPE bloom_filter GRANULARITY 3,
    INDEX url_idx url TYPE bloom_filter GRANULARITY 3,
    INDEX country_code_idx country_code TYPE bloom_filter GRANULARITY 3,
    INDEX subdivision_code_idx subdivision_code TYPE bloom_filter GRANULARITY 3,
    INDEX city_idx city TYPE bloom_filter GRANULARITY 3,
    INDEX browser_idx browser TYPE bloom_filter GRANULARITY 3,
    INDEX browser_version_idx browser_version TYPE bloom_filter GRANULARITY 3,
    INDEX os_idx os TYPE bloom_filter GRANULARITY 3,
    INDEX os_version_idx os_version TYPE bloom_filter GRANULARITY 3,
    INDEX referrer_source_idx referrer_source TYPE bloom_filter GRANULARITY 3,
    INDEX utm_source_idx utm_source TYPE bloom_filter GRANULARITY 3,
    INDEX utm_medium_idx utm_medium TYPE bloom_filter GRANULARITY 3,
    INDEX utm_campaign_idx utm_campaign TYPE bloom_filter GRANULARITY 3,
    INDEX custom_event_name_idx custom_event_name TYPE bloom_filter GRANULARITY 3
) ENGINE = MergeTree()
PARTITION BY toYYYYMM(date)
ORDER BY (site_id, event_type, toDate(timestamp), visitor_id, timestamp)
SAMPLE BY visitor_id
TTL timestamp + toIntervalDay(365)
SETTINGS index_granularity = 8192;

INSERT INTO analytics.events_new (
    site_id, visitor_id, session_id, domain, url, device_type,
    country_code, subdivision_code, city, timestamp, date,
    browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    event_type, custom_event_name, custom_event_json, outbound_link_url,
    cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
    scroll_depth_percentage, scroll_depth_pixels,
    error_exceptions, error_type, error_message, error_fingerprint
)
SELECT
    site_id, visitor_id,
    reinterpretAsUInt64(reverse(unhex(substring(session_id, 1, 16)))) as session_id,
    domain, url, device_type,
    country_code, subdivision_code, city, timestamp, date,
    browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    event_type, custom_event_name, custom_event_json, outbound_link_url,
    cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
    scroll_depth_percentage, scroll_depth_pixels,
    error_exceptions, error_type, error_message, error_fingerprint
FROM analytics.events;

DROP VIEW IF EXISTS analytics.usage_by_site_daily;

RENAME TABLE
    analytics.events TO analytics.events_old_2,
    analytics.events_new TO analytics.events;

DROP TABLE IF EXISTS analytics.events_old_2;

CREATE MATERIALIZED VIEW analytics.usage_by_site_daily
ENGINE = SummingMergeTree()
ORDER BY (site_id, date)
AS SELECT
    site_id,
    toDate(timestamp) as date,
    count() as event_count
FROM analytics.events
WHERE event_type != 'scroll_depth'
GROUP BY site_id, date;
