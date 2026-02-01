DROP VIEW IF EXISTS analytics.usage_by_site_daily;

CREATE MATERIALIZED VIEW analytics.usage_by_site_daily
ENGINE = SummingMergeTree()
ORDER BY (site_id, date)
AS SELECT
    site_id,
    toDate(timestamp) as date,
    count() as event_count
FROM analytics.events
WHERE event_type != 5
GROUP BY site_id, date;

INSERT INTO analytics.usage_by_site_daily
SELECT
    site_id,
    toDate(timestamp) as date,
    count() as event_count
FROM analytics.events
WHERE event_type != 5
GROUP BY site_id, date;
