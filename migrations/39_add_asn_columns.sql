ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS asn UInt32 DEFAULT 0;
ALTER TABLE analytics.events ADD COLUMN IF NOT EXISTS asn_org LowCardinality(String) DEFAULT '';
ALTER TABLE analytics.bot_events ADD COLUMN IF NOT EXISTS asn UInt32 DEFAULT 0;
ALTER TABLE analytics.bot_events ADD COLUMN IF NOT EXISTS asn_org LowCardinality(String) DEFAULT '';
