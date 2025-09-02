ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'cwv' = 3);
    
ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS cwv_cls Nullable(Float32) AFTER custom_event_json,
    ADD COLUMN IF NOT EXISTS cwv_lcp Nullable(Float32) AFTER cwv_cls,
    ADD COLUMN IF NOT EXISTS cwv_inp Nullable(Float32) AFTER cwv_lcp,
    ADD COLUMN IF NOT EXISTS cwv_fcp Nullable(Float32) AFTER cwv_inp,
    ADD COLUMN IF NOT EXISTS cwv_ttfb Nullable(Float32) AFTER cwv_fcp;