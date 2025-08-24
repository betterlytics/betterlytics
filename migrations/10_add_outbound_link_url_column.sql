ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'outbound_link' = 3),
    ADD COLUMN IF NOT EXISTS outbound_link_url String DEFAULT '' AFTER custom_event_json;
