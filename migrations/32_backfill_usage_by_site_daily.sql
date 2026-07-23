INSERT INTO analytics.usage_by_site_daily
SELECT
    site_id,
    toDate(timestamp) as date,
    countIf(event_type != 'scroll_depth') as event_count
FROM analytics.events
GROUP BY site_id, date;

OPTIMIZE TABLE analytics.usage_by_site_daily FINAL;
