-- Keep full bot-event history; reintroduce a TTL only if volume demands it.
ALTER TABLE analytics.bot_events REMOVE TTL;
