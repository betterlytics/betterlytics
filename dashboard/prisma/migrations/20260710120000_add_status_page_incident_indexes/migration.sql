-- DropIndex
DROP INDEX "StatusPageIncident_statusPageId_idx";

-- CreateIndex
CREATE INDEX "StatusPageIncident_statusPageId_startedAt_idx" ON "StatusPageIncident"("statusPageId", "startedAt");

-- CreateIndex
CREATE INDEX "StatusPageIncident_dashboardId_status_idx" ON "StatusPageIncident"("dashboardId", "status");
