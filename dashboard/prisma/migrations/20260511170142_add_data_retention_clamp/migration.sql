-- AlterTable
ALTER TABLE "DashboardSettings" ADD COLUMN     "retentionGraceRestoreDays" INTEGER,
ADD COLUMN     "retentionGraceUntil" TIMESTAMP(3);

UPDATE "DashboardSettings"
SET "dataRetentionDays" = 180
WHERE "dataRetentionDays" < 180;

ALTER TABLE "DashboardSettings"
ADD CONSTRAINT "retention_grace_consistent" CHECK (
  ("retentionGraceUntil" IS NULL AND "retentionGraceRestoreDays" IS NULL)
  OR (
    "retentionGraceUntil" IS NOT NULL
    AND "retentionGraceRestoreDays" IS NOT NULL
    AND "retentionGraceRestoreDays" > "dataRetentionDays"
  )
);