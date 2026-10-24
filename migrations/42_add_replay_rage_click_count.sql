ALTER TABLE analytics.session_replays
    ADD COLUMN IF NOT EXISTS rage_click_count UInt32 DEFAULT 0;
