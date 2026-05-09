-- Add canonical referrer source storage and query-time effective classification.

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS referrer_source_canonical LowCardinality(String) DEFAULT ''
    AFTER referrer_source;

ALTER TABLE analytics.sessions
    ADD COLUMN IF NOT EXISTS referrer_source_canonical
        SimpleAggregateFunction(min, Tuple(DateTime, String))
    AFTER referrer_source;

DROP VIEW IF EXISTS analytics.sessions_mv;

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.sessions_mv
TO analytics.sessions AS
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
    min(tuple(timestamp, referrer_source_canonical)) AS referrer_source_canonical,
    min(tuple(timestamp, referrer_source_name)) AS referrer_source_name,
    min(tuple(timestamp, referrer_search_term)) AS referrer_search_term,
    min(tuple(timestamp, referrer_url)) AS referrer_url,
    min(tuple(timestamp, utm_source)) AS utm_source,
    min(tuple(timestamp, utm_medium)) AS utm_medium,
    min(tuple(timestamp, utm_campaign)) AS utm_campaign,
    min(tuple(timestamp, utm_term)) AS utm_term,
    min(tuple(timestamp, utm_content)) AS utm_content
FROM analytics.events
GROUP BY site_id, session_created_at, session_id;

CREATE TABLE IF NOT EXISTS analytics.referrer_source_categories (
    generation UInt64,
    key String,
    medium LowCardinality(String)
) ENGINE = ReplacingMergeTree(generation)
ORDER BY key;

CREATE VIEW IF NOT EXISTS analytics.referrer_source_categories_current AS
SELECT
    key,
    argMax(medium, generation) AS medium
FROM analytics.referrer_source_categories
GROUP BY key;

CREATE DICTIONARY IF NOT EXISTS analytics.referrer_source_categories_dict (
    key String,
    medium String DEFAULT ''
)
PRIMARY KEY key
SOURCE(CLICKHOUSE(NAME referrer_dict_source TABLE 'referrer_source_categories_current' DB 'analytics'))
LAYOUT(HASHED())
LIFETIME(MIN 3600 MAX 7200);

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS referrer_source_effective String ALIAS
        coalesce(
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', referrer_source_canonical, ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', referrer_url)), ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', referrer_source_name, ''), ''),
            referrer_source
        );

ALTER TABLE analytics.sessions
    ADD COLUMN IF NOT EXISTS referrer_source_effective String ALIAS
        coalesce(
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', tupleElement(referrer_source_canonical, 2), ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', tupleElement(referrer_url, 2))), ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', tupleElement(referrer_source_name, 2), ''), ''),
            tupleElement(referrer_source, 2)
        );
