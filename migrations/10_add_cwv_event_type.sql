ALTER TABLE analytics.events
    MODIFY COLUMN event_type Enum8('pageview' = 1, 'custom' = 2, 'cwv' = 3);