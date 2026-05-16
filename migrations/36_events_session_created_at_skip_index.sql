ALTER TABLE analytics.events
    ADD INDEX IF NOT EXISTS session_created_at_idx session_created_at
    TYPE minmax GRANULARITY 8;

ALTER TABLE analytics.events
    MATERIALIZE INDEX session_created_at_idx;
