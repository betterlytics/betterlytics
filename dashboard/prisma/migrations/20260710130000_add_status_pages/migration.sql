-- CreateEnum
CREATE TYPE "StatusPageIncidentImpact" AS ENUM ('degraded', 'partial_outage', 'outage');

-- CreateEnum
CREATE TYPE "StatusPageIncidentStatus" AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');

-- CreateTable
CREATE TABLE "StatusPage" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "homepageUrl" TEXT,
    "customDomain" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "accentColor" TEXT NOT NULL DEFAULT '#4845d8',
    "logoHash" TEXT,
    "faviconHash" TEXT,
    "showPastIncidents" BOOLEAN NOT NULL DEFAULT true,
    "hideBranding" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StatusPage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageImage" (
    "statusPageId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "mimeType" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StatusPageImage_pkey" PRIMARY KEY ("statusPageId","kind")
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

-- CreateTable
CREATE TABLE "StatusPageIncident" (
    "id" TEXT NOT NULL,
    "statusPageId" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "impact" "StatusPageIncidentImpact" NOT NULL DEFAULT 'outage',
    "status" "StatusPageIncidentStatus" NOT NULL DEFAULT 'investigating',
    "startedAt" TIMESTAMP(3) NOT NULL,
    "resolvedAt" TIMESTAMP(3),
    "monitorCheckIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "detectedIncidentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StatusPageIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusPageIncidentUpdate" (
    "id" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "status" "StatusPageIncidentStatus" NOT NULL,
    "message" TEXT NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusPageIncidentUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- Partial unique index: a slug is unique only among live (non-soft-deleted) pages, so deleting
-- a page frees its slug for reuse. Prisma can't express the WHERE clause, so it lives here.
CREATE UNIQUE INDEX "StatusPage_slug_key" ON "StatusPage"("slug") WHERE "deletedAt" IS NULL;

-- CreateIndex
-- A custom domain can be claimed by at most one live (non-soft-deleted) status page, mirroring the
-- slug constraint. Prisma can't express the partial WHERE clause, so the index lives here. NULL
-- customDomains are excluded, so pages without a custom domain never collide.
CREATE UNIQUE INDEX "StatusPage_customDomain_key" ON "StatusPage"("customDomain") WHERE "customDomain" IS NOT NULL AND "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "StatusPage_dashboardId_idx" ON "StatusPage"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPage_id_dashboardId_key" ON "StatusPage"("id", "dashboardId");

-- CreateIndex
CREATE INDEX "StatusPageMonitor_statusPageId_idx" ON "StatusPageMonitor"("statusPageId");

-- CreateIndex
CREATE UNIQUE INDEX "StatusPageMonitor_statusPageId_monitorCheckId_key" ON "StatusPageMonitor"("statusPageId", "monitorCheckId");

-- CreateIndex
CREATE INDEX "StatusPageIncident_statusPageId_startedAt_idx" ON "StatusPageIncident"("statusPageId", "startedAt");

-- CreateIndex
CREATE INDEX "StatusPageIncident_dashboardId_status_idx" ON "StatusPageIncident"("dashboardId", "status");

-- CreateIndex
CREATE INDEX "StatusPageIncidentUpdate_incidentId_createdAt_idx" ON "StatusPageIncidentUpdate"("incidentId", "createdAt");

-- AddForeignKey
ALTER TABLE "StatusPage" ADD CONSTRAINT "StatusPage_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageImage" ADD CONSTRAINT "StatusPageImage_statusPageId_fkey" FOREIGN KEY ("statusPageId") REFERENCES "StatusPage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageMonitor" ADD CONSTRAINT "StatusPageMonitor_statusPageId_dashboardId_fkey" FOREIGN KEY ("statusPageId", "dashboardId") REFERENCES "StatusPage"("id", "dashboardId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageMonitor" ADD CONSTRAINT "StatusPageMonitor_monitorCheckId_dashboardId_fkey" FOREIGN KEY ("monitorCheckId", "dashboardId") REFERENCES "MonitorCheck"("id", "dashboardId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageIncident" ADD CONSTRAINT "StatusPageIncident_statusPageId_dashboardId_fkey" FOREIGN KEY ("statusPageId", "dashboardId") REFERENCES "StatusPage"("id", "dashboardId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageIncident" ADD CONSTRAINT "StatusPageIncident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageIncidentUpdate" ADD CONSTRAINT "StatusPageIncidentUpdate_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "StatusPageIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;
