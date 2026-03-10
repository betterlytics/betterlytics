-- Add geoLevel to SiteConfig with default
ALTER TABLE "SiteConfig" ADD COLUMN "geoLevel" TEXT NOT NULL DEFAULT 'COUNTRY';

-- Copy existing values from DashboardSettings where both exist
UPDATE "SiteConfig" sc
SET "geoLevel" = ds."geoLevel"
FROM "DashboardSettings" ds
INNER JOIN "Dashboard" d ON d."id" = ds."dashboardId"
WHERE d."id" = sc."dashboardId";

-- Drop from DashboardSettings
ALTER TABLE "DashboardSettings" DROP COLUMN "geoLevel";
