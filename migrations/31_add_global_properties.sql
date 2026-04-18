ALTER TABLE analytics.events
  ADD COLUMN IF NOT EXISTS global_properties_json String DEFAULT '' AFTER session_created_at;
