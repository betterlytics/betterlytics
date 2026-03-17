ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3, 'cwv' = 4, 'scroll_depth' = 5, 'js_error' = 6);

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS exception_list String DEFAULT '' AFTER scroll_depth_pixels,
    ADD COLUMN IF NOT EXISTS error_type LowCardinality(String) DEFAULT '' AFTER exception_list,
    ADD COLUMN IF NOT EXISTS error_message String DEFAULT '' AFTER error_type,
    ADD COLUMN IF NOT EXISTS error_fingerprint String DEFAULT '' AFTER error_message;
