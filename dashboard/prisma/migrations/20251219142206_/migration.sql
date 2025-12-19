/*
  Warnings:

  - You are about to drop the column `errorMessage` on the `MonitorAlertHistory` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "MonitorAlertHistory" DROP COLUMN "errorMessage";
