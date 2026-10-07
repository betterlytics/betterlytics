-- MigrateData: monitors saved before at least one accepted status code was required may hold an
-- empty list, which the probe already treats as 2xx. Store that explicitly so the setting matches
-- what is checked. "updatedAt" is left alone: probe behavior does not change.
UPDATE "MonitorCheck"
SET "acceptedStatusCodes" = '["2xx"]'::jsonb
WHERE "acceptedStatusCodes" = '[]'::jsonb;
