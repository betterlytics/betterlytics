-- AlterTable: Add userLastFetched column for caching user data fetch timestamp
ALTER TABLE "Session" ADD COLUMN "userLastFetched" TIMESTAMP(3);
