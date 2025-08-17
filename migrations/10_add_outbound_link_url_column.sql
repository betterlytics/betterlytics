ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS outbound_link_url String AFTER custom_event_json;