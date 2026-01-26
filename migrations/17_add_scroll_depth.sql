ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3, 'cwv' = 4, 'scroll_depth' = 5);

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS scroll_depth_percentage Nullable(Float32) AFTER cwv_ttfb,
    ADD COLUMN IF NOT EXISTS scroll_depth_pixels Nullable(Float32) AFTER scroll_depth_percentage;
