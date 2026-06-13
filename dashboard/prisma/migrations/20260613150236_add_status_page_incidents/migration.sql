-- CreateEnum
CREATE TYPE "StatusPageIncidentImpact" AS ENUM ('degraded', 'outage');

-- CreateEnum
CREATE TYPE "StatusPageIncidentStatus" AS ENUM ('investigating', 'identified', 'monitoring', 'resolved');

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
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "monitorCheckId" TEXT,
    "detectedIncidentId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "StatusPageIncident_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StatusPageIncident_statusPageId_isPublished_idx" ON "StatusPageIncident"("statusPageId", "isPublished");

-- CreateIndex
CREATE INDEX "StatusPageIncident_statusPageId_idx" ON "StatusPageIncident"("statusPageId");

-- AddForeignKey
ALTER TABLE "StatusPageIncident" ADD CONSTRAINT "StatusPageIncident_statusPageId_dashboardId_fkey" FOREIGN KEY ("statusPageId", "dashboardId") REFERENCES "StatusPage"("id", "dashboardId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusPageIncident" ADD CONSTRAINT "StatusPageIncident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
