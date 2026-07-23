-- CreateEnum
CREATE TYPE "ErrorGroupStatusValue" AS ENUM ('unresolved', 'resolved', 'ignored');

-- CreateTable
CREATE TABLE "ErrorGroup" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "errorFingerprint" TEXT NOT NULL,
    "status" "ErrorGroupStatusValue" NOT NULL DEFAULT 'unresolved',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ErrorGroup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ErrorGroup_dashboardId_idx" ON "ErrorGroup"("dashboardId");

-- CreateIndex
CREATE UNIQUE INDEX "ErrorGroup_dashboardId_errorFingerprint_key" ON "ErrorGroup"("dashboardId", "errorFingerprint");

-- AddForeignKey
ALTER TABLE "ErrorGroup" ADD CONSTRAINT "ErrorGroup_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
