ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS subdivision_code LowCardinality(Nullable(String)) AFTER country_code,
    ADD COLUMN IF NOT EXISTS city LowCardinality(Nullable(String)) AFTER subdivision_code;

ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS subdivision_code_idx subdivision_code TYPE bloom_filter GRANULARITY 3,
    ADD INDEX IF NOT EXISTS city_idx city TYPE bloom_filter GRANULARITY 3;
