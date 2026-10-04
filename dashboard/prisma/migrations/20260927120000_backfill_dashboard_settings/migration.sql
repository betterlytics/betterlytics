-- MigrateData: dashboards created before settings rows were made at creation (#904) and never
-- opened since have no row. The retention-purge job only sees dashboards with one, and there is
-- no events TTL anymore, so give them one with DB defaults (dataRetentionDays 365).
INSERT INTO "DashboardSettings" ("id", "dashboardId", "updatedAt")
SELECT gen_random_uuid(), d."id", CURRENT_TIMESTAMP
FROM "Dashboard" d
LEFT JOIN "DashboardSettings" s ON s."dashboardId" = d."id"
WHERE s."id" IS NULL;
