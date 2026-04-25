ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3, 'cwv' = 4, 'scroll_depth' = 5, 'client_error' = 6, 'engagement' = 7);

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS duration_seconds UInt32 DEFAULT 0;
