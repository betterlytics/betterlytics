/*
  Warnings:

  - A unique constraint covering the columns `[id,dashboardId]` on the table `MonitorCheck` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MonitorCheck_id_dashboardId_key" ON "MonitorCheck"("id", "dashboardId");
