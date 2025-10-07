ALTER TABLE analytics.session_replays
MODIFY TTL date + INTERVAL 2 MONTH DELETE;