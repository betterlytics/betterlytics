ALTER TABLE analytics.events
  ADD COLUMN IF NOT EXISTS global_properties_keys Array(String) CODEC(ZSTD(3)) AFTER session_created_at,
  ADD COLUMN IF NOT EXISTS global_properties_values Array(String) CODEC(ZSTD(3)) AFTER global_properties_keys;

ALTER TABLE analytics.events
  ADD INDEX IF NOT EXISTS idx_gp_keys global_properties_keys TYPE bloom_filter(0.01) GRANULARITY 1;

ALTER TABLE analytics.sessions
  ADD COLUMN IF NOT EXISTS all_props SimpleAggregateFunction(groupUniqArrayArray, Array(Tuple(String, String))) DEFAULT [];

DROP VIEW IF EXISTS analytics.sessions_mv;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.sessions_mv TO analytics.sessions AS
SELECT
    site_id,
    session_created_at,
    session_id,
    min(timestamp) AS session_start,
    max(timestamp) AS session_end,
    countIf(event_type = 'pageview') AS pageview_count,
    min(if(event_type = 'pageview', tuple(timestamp, url), tuple(toDateTime('2106-02-07 06:28:15'), ''))) AS entry_page,
    max(if(event_type = 'pageview', tuple(timestamp, url), tuple(toDateTime('1970-01-01 00:00:00'), ''))) AS exit_page,
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
    min(tuple(timestamp, utm_content)) AS utm_content,
    groupUniqArrayArray(arrayZip(global_properties_keys, global_properties_values)) AS all_props
FROM analytics.events
GROUP BY site_id, session_created_at, session_id;
