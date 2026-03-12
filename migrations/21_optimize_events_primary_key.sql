-- Migration 21: Optimize events primary key
-- Changes ORDER BY from (site_id, date, visitor_id, session_id, timestamp)
-- to (site_id, event_type, timestamp)

CREATE TABLE analytics.events_new (
    site_id String,
    visitor_id String,
    session_id String,
    domain String DEFAULT '',
    url String,
    device_type LowCardinality(String),
    country_code LowCardinality(Nullable(String)),
    timestamp DateTime,
    date Date DEFAULT toDate(timestamp),
    browser LowCardinality(String) DEFAULT '',
    browser_version LowCardinality(String) DEFAULT '',
    os LowCardinality(String) DEFAULT '',
    os_version LowCardinality(String) DEFAULT '',
    referrer_source String DEFAULT 'direct',
    referrer_source_name String DEFAULT '',
    referrer_search_term String DEFAULT '',
    referrer_url String DEFAULT '',
    utm_source String DEFAULT '',
    utm_medium String DEFAULT '',
    utm_campaign String DEFAULT '',
    utm_term String DEFAULT '',
    utm_content String DEFAULT '',
    event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3, 'cwv' = 4, 'scroll_depth' = 5),
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

    INDEX visitor_idx visitor_id TYPE bloom_filter GRANULARITY 3,
    INDEX session_idx session_id TYPE bloom_filter GRANULARITY 3,
    INDEX url_idx url TYPE bloom_filter GRANULARITY 3,
    INDEX country_code_idx country_code TYPE bloom_filter GRANULARITY 3,
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
ORDER BY (site_id, event_type, timestamp)
TTL timestamp + toIntervalDay(365)
SETTINGS index_granularity = 8192;

DROP VIEW IF EXISTS analytics.daily_page_views;

DROP VIEW IF EXISTS analytics.daily_unique_visitors;

DROP VIEW IF EXISTS analytics.usage_by_site_daily;

INSERT INTO analytics.events_new (
    site_id, visitor_id, session_id, domain, url, device_type, country_code,
    timestamp, date, browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    event_type, custom_event_name, custom_event_json, outbound_link_url,
    cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
    scroll_depth_percentage, scroll_depth_pixels
)
SELECT
    site_id, visitor_id, session_id, domain, url, device_type, country_code,
    timestamp, date, browser, browser_version, os, os_version,
    referrer_source, referrer_source_name, referrer_search_term, referrer_url,
    utm_source, utm_medium, utm_campaign, utm_term, utm_content,
    event_type, custom_event_name, custom_event_json, outbound_link_url,
    cwv_cls, cwv_lcp, cwv_inp, cwv_fcp, cwv_ttfb,
    scroll_depth_percentage, scroll_depth_pixels
FROM analytics.events;

RENAME TABLE
    analytics.events TO analytics.events_old,
    analytics.events_new TO analytics.events;

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

INSERT INTO analytics.usage_by_site_daily
SELECT
    site_id,
    toDate(timestamp) as date,
    count() as event_count
FROM analytics.events
WHERE event_type != 'scroll_depth'
GROUP BY site_id, date;
