ALTER TABLE analytics.monitor_alert_history
    ADD COLUMN IF NOT EXISTS channel LowCardinality(String) DEFAULT 'email' AFTER alert_type;
