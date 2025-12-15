-- AlterTable
ALTER TABLE "MonitorCheck" ADD COLUMN     "httpMethod" TEXT NOT NULL DEFAULT 'HEAD',
ADD COLUMN     "requestHeaders" JSONB;
