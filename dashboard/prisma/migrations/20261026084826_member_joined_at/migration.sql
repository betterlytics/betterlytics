-- AlterTable
ALTER TABLE "UserDashboard" ADD COLUMN     "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Before role changes opened new rows, every row started its own access period
UPDATE "UserDashboard" SET "joinedAt" = "createdAt";
