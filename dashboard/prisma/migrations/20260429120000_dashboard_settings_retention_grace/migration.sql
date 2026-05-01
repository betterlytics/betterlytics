-- AlterTable
ALTER TABLE "DashboardSettings"
  ADD COLUMN "retentionGraceUntil" TIMESTAMP(3),
  ADD COLUMN "retentionGraceFloorDays" INTEGER;
