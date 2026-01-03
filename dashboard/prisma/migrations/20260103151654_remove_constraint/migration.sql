-- DropIndex
DROP INDEX "DashboardInvitation_dashboardId_email_key";

-- CreateIndex
CREATE INDEX "DashboardInvitation_dashboardId_email_idx" ON "DashboardInvitation"("dashboardId", "email");
