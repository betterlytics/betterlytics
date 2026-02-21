-- CreateTable
CREATE TABLE "DashboardIntegration" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardIntegration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DashboardIntegration_dashboardId_idx" ON "DashboardIntegration"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "DashboardIntegration_dashboardId_type_key" ON "DashboardIntegration"("dashboardId", "type");

-- AddForeignKey
ALTER TABLE "DashboardIntegration" ADD CONSTRAINT "DashboardIntegration_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
