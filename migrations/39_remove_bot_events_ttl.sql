-- Bot events are the evidence base for promoting or demoting filter rules; keep
-- the full history and reintroduce a TTL only if volume demands it.
ALTER TABLE analytics.bot_events REMOVE TTL;
