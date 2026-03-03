ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS error_fingerprint String DEFAULT '' AFTER error_message;
