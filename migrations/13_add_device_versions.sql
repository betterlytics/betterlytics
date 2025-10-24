ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS browser_version String DEFAULT '';

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS os_version String DEFAULT '';

ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS browser_version_idx browser_version TYPE bloom_filter GRANULARITY 3;

ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS os_version_idx os_version TYPE bloom_filter GRANULARITY 3;


