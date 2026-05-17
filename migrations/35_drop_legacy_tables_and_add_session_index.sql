DROP TABLE IF EXISTS analytics.events_old;
DROP TABLE IF EXISTS analytics.events_old_2;
DROP TABLE IF EXISTS analytics.session_replays_old;
DROP TABLE IF EXISTS analytics.session_replays_old_2;

ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS session_created_at_idx session_created_at
    TYPE minmax GRANULARITY 8;

ALTER TABLE analytics.events
    MATERIALIZE INDEX session_created_at_idx;
