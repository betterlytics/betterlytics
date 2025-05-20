ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS domain String AFTER session_id; 