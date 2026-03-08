ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS referrer_domain String DEFAULT '' AFTER referrer_url;

ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS referrer_domain_idx referrer_domain TYPE bloom_filter GRANULARITY 3;

-- Backfill referrer_domain from referrer_url for all existing rows
ALTER TABLE analytics.events
    UPDATE referrer_domain = cutToFirstSignificantSubdomain(concat('http://', referrer_url))
    WHERE referrer_url != '' AND referrer_domain = '';
