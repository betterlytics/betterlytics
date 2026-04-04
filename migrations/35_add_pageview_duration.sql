ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3, 'cwv' = 4, 'scroll_depth' = 5, 'client_error' = 6, 'pagehide' = 7);

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS prev_url String DEFAULT '' AFTER session_created_at,
    ADD COLUMN IF NOT EXISTS prev_pageview_duration Nullable(UInt32) DEFAULT NULL AFTER prev_url;
