ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'scroll_depth' = 3),
    ADD COLUMN IF NOT EXISTS scroll_depth Nullable(Float32) AFTER custom_event_json;