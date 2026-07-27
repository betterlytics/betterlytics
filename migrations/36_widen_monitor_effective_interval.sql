-- Check intervals can now be up to 24h (86400s), which overflows UInt16 (max 65535).
-- The column is a per-probe measurement the backend always writes; drop the legacy
-- DEFAULT 30 for 0 ("unknown"), matching the other backoff columns.
ALTER TABLE analytics.monitor_results
    MODIFY COLUMN effective_interval_seconds UInt32 DEFAULT 0;
