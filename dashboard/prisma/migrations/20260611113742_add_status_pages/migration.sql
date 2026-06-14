-- CreateTable
CREATE TABLE "StatusPage" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "accentColor" TEXT NOT NULL DEFAULT '#4845d8',
    "logoUrl" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "showPastIncidents" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageMonitor" (
    "id" TEXT NOT NULL,
    "statusPageId" TEXT NOT NULL,
    "monitorCheckId" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "publicName" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StatusPageMonitor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Partial unique index: a slug is unique only among live (non-soft-deleted) pages, so deleting
-- a page frees its slug for reuse. Prisma can't express the WHERE clause, so it lives here.
CREATE UNIQUE INDEX "StatusPage_slug_key" ON "StatusPage"("slug") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "StatusPage_dashboardId_idx" ON "StatusPage"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_id_dashboardId_key" ON "StatusPage"("id", "dashboardId");

-- CreateIndex
CREATE INDEX "StatusPageMonitor_statusPageId_idx" ON "StatusPageMonitor"("statusPageId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageMonitor_statusPageId_monitorCheckId_key" ON "StatusPageMonitor"("statusPageId", "monitorCheckId");

-- AddForeignKey
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageMonitor" ADD CONSTRAINT "StatusPageMonitor_statusPageId_dashboardId_fkey" FOREIGN KEY ("statusPageId", "dashboardId") REFERENCES "StatusPage"("id", "dashboardId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageMonitor" ADD CONSTRAINT "StatusPageMonitor_monitorCheckId_dashboardId_fkey" FOREIGN KEY ("monitorCheckId", "dashboardId") REFERENCES "MonitorCheck"("id", "dashboardId") ON DELETE CASCADE ON UPDATE CASCADE;
