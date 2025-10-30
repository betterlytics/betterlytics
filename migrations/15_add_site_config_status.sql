ALTER TABLE analytics.events
ADD COLUMN IF NOT EXISTS site_config_status Enum8(
    'approved' = 1,
    'missing' = 2,
    'fetch_error' = 3
) DEFAULT 'missing';