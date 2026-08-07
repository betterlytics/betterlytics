-- Replace usage_by_site_daily (site_id x date) with usage_daily, adding an event_type
-- dimension so billable usage can be broken down per event type.
--
-- The billable whitelist below is mirrored in the dashboard as BILLABLE_EVENT_TYPES
-- (billing.entities.ts) for display labels, and described in prose by the
-- `usage.breakdown.nonBillableNote` message. Changing it here means updating both.

DROP VIEW IF EXISTS analytics.usage_by_site_daily;
DROP VIEW IF EXISTS analytics.usage_daily_mv;
DROP TABLE IF EXISTS analytics.usage_daily;

CREATE TABLE IF NOT EXISTS analytics.usage_daily (
    site_id LowCardinality(String),
    date Date,
    event_type LowCardinality(String),
    event_count UInt64
) ENGINE = SummingMergeTree()
ORDER BY (site_id, date, event_type);

CREATE MATERIALIZED VIEW IF NOT EXISTS analytics.usage_daily_mv
TO analytics.usage_daily AS
SELECT
    site_id,
    toDate(timestamp)     AS date,
    toString(event_type)  AS event_type,
    count()               AS event_count
FROM analytics.events
WHERE event_type IN ('pageview', 'custom', 'outbound_link', 'cwv', 'client_error')
GROUP BY site_id, date, event_type;

SET max_execution_time = 0;
SET send_progress_in_http_headers = 1;
SET http_headers_progress_interval_ms = 30000;

INSERT INTO analytics.usage_daily
SELECT
    site_id,
    toDate(timestamp)     AS date,
    toString(event_type)  AS event_type,
    count()               AS event_count
FROM analytics.events
WHERE event_type IN ('pageview', 'custom', 'outbound_link', 'cwv', 'client_error')
GROUP BY site_id, date, event_type;

OPTIMIZE TABLE analytics.usage_daily FINAL;
