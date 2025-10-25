ALTER TABLE analytics.events
    DROP INDEX IF EXISTS browser_idx,
    DROP INDEX IF EXISTS os_idx,
    DROP INDEX IF EXISTS country_code_idx,
    DROP INDEX IF EXISTS referrer_source_idx,
    DROP INDEX IF EXISTS utm_medium_idx,
    DROP INDEX IF EXISTS browser_version_idx,
    DROP INDEX IF EXISTS os_version_idx;

ALTER TABLE analytics.events
    MODIFY COLUMN browser LowCardinality(String),
    MODIFY COLUMN browser_version LowCardinality(String),
    MODIFY COLUMN os LowCardinality(String),
    MODIFY COLUMN os_version LowCardinality(String),
    MODIFY COLUMN device_type LowCardinality(String),
    MODIFY COLUMN country_code LowCardinality(Nullable(String)),
    MODIFY COLUMN domain LowCardinality(String),
    MODIFY COLUMN referrer_source LowCardinality(String),
    MODIFY COLUMN utm_medium LowCardinality(String);

ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS browser_idx browser TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS os_idx os TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS country_code_idx country_code TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS referrer_source_idx referrer_source TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS utm_medium_idx utm_medium TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS browser_version_idx browser_version TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS os_version_idx os_version TYPE bloom_filter GRANULARITY 3;