-- AlterTable
ALTER TABLE "DashboardSettings" ADD COLUMN "aiAccessEnabled" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "McpGrantExcludedDashboard" (
    "grantId" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,

    CONSTRAINT "McpGrantExcludedDashboard_pkey" PRIMARY KEY ("grantId","dashboardId")
);

-- CreateIndex
CREATE INDEX "McpGrantExcludedDashboard_dashboardId_idx" ON "McpGrantExcludedDashboard"("dashboardId");

-- AddForeignKey
ALTER TABLE "McpGrantExcludedDashboard" ADD CONSTRAINT "McpGrantExcludedDashboard_grantId_fkey" FOREIGN KEY ("grantId") REFERENCES "McpGrant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "McpGrantExcludedDashboard" ADD CONSTRAINT "McpGrantExcludedDashboard_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
