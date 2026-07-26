-- Check intervals can now be up to 24h (86400s), which overflows UInt16 (max 65535).
ALTER TABLE analytics.monitor_results
    MODIFY COLUMN effective_interval_seconds UInt32 DEFAULT 30;
