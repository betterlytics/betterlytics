-- CreateTable
CREATE TABLE "SiteConfig" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "blacklistedIps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "enforceDomain" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SiteConfig_dashboardId_key" ON "SiteConfig"("dashboardId");

-- AddForeignKey
ALTER TABLE "SiteConfig" ADD CONSTRAINT "SiteConfig_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;


INSERT INTO "SiteConfig" ("id", "dashboardId", "updatedAt")
SELECT gen_random_uuid(), d."id", NOW()
FROM "Dashboard" d
LEFT JOIN "SiteConfig" sc ON sc."dashboardId" = d."id"
WHERE sc."dashboardId" IS NULL;