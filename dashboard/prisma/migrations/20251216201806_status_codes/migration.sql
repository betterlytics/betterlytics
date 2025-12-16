/*
  Warnings:

  - The `acceptedStatusCodes` column on the `MonitorCheck` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "MonitorCheck" DROP COLUMN "acceptedStatusCodes",
ADD COLUMN     "acceptedStatusCodes" JSONB NOT NULL DEFAULT '["2xx"]';
