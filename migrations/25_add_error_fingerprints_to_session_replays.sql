ALTER TABLE analytics.session_replays
    ADD COLUMN IF NOT EXISTS error_fingerprints Array(String) DEFAULT [];
