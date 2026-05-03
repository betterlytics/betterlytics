-- CreateEnum
CREATE TYPE "BugReportStatus" AS ENUM ('open', 'resolved', 'ignored');

-- CreateEnum
CREATE TYPE "SuperAdminAuditStatus" AS ENUM ('success', 'failed');

-- AlterTable
ALTER TABLE "BugReport" ADD COLUMN     "status" "BugReportStatus" NOT NULL DEFAULT 'open';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SuperAdminAuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetType" TEXT NOT NULL,
    "targetId" TEXT,
    "payload" JSONB NOT NULL DEFAULT '{}',
    "status" "SuperAdminAuditStatus" NOT NULL DEFAULT 'success',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuperAdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_actorUserId_idx" ON "SuperAdminAuditLog"("actorUserId");

-- CreateIndex
CREATE INDEX "SuperAdminAuditLog_createdAt_idx" ON "SuperAdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");
