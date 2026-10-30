ALTER TABLE analytics.session_replays
    ADD COLUMN IF NOT EXISTS dead_click_count UInt32 DEFAULT 0;
