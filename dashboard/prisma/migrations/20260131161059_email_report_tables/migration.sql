/*
  Warnings:

  - You are about to drop the column `reportRecipients` on the `DashboardSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DashboardSettings" DROP COLUMN "reportRecipients",
ADD COLUMN     "lastMonthlyReportSentAt" TIMESTAMP(3),
ADD COLUMN     "lastWeeklyReportSentAt" TIMESTAMP(3),
ADD COLUMN     "monthlyReportRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weeklyReportDay" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "weeklyReportRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Reset all existing weeklyReports to false for the new email reports feature
UPDATE "DashboardSettings" SET "weeklyReports" = false;

-- Set default for future rows
ALTER TABLE "DashboardSettings" ALTER COLUMN "weeklyReports" SET DEFAULT false;

-- CreateTable
CREATE TABLE "EmailReportHistory" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "errorMessage" TEXT,

    CONSTRAINT "EmailReportHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailReportHistory_dashboardId_sentAt_idx" ON "EmailReportHistory"("dashboardId", "sentAt");

-- AddForeignKey
ALTER TABLE "EmailReportHistory" ADD CONSTRAINT "EmailReportHistory_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
