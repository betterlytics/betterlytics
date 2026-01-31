/*
  Warnings:

  - You are about to drop the column `reportRecipients` on the `DashboardSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "DashboardSettings" DROP COLUMN "reportRecipients",
ADD COLUMN     "monthlyReportRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "weeklyReportRecipients" TEXT[] DEFAULT ARRAY[]::TEXT[];
