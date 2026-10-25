-- MigrateData: deleting a dashboard now soft-deletes its status pages, freeing their slugs and
-- custom domains. Release the pages of dashboards deleted before that, stamped with the
-- dashboard's own deletion time like new deletions are.
UPDATE "StatusPage" sp
SET "deletedAt" = d."deletedAt"
FROM "Dashboard" d
WHERE sp."dashboardId" = d."id"
  AND sp."deletedAt" IS NULL
  AND d."deletedAt" IS NOT NULL;
