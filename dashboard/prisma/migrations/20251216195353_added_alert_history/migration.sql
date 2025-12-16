-- CreateEnum
CREATE TYPE "MonitorAlertType" AS ENUM ('down', 'recovery', 'ssl_expiring', 'ssl_expired');

-- AlterTable
ALTER TABLE "MonitorCheck" ADD COLUMN     "alertEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "alertOnDown" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertOnRecovery" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertOnSslExpiry" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "failureThreshold" INTEGER NOT NULL DEFAULT 3,
ADD COLUMN     "sslExpiryAlertDays" INTEGER NOT NULL DEFAULT 14;

-- CreateTable
CREATE TABLE "MonitorAlertHistory" (
    "id" TEXT NOT NULL,
    "monitorCheckId" TEXT NOT NULL,
    "alertType" "MonitorAlertType" NOT NULL,
    "sentTo" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER,
    "errorMessage" TEXT,
    "latencyMs" INTEGER,
    "sslDaysLeft" INTEGER,

    CONSTRAINT "MonitorAlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorAlertHistory_monitorCheckId_idx" ON "MonitorAlertHistory"("monitorCheckId");

-- CreateIndex
CREATE INDEX "MonitorAlertHistory_sentAt_idx" ON "MonitorAlertHistory"("sentAt");

-- AddForeignKey
ALTER TABLE "MonitorAlertHistory" ADD CONSTRAINT "MonitorAlertHistory_monitorCheckId_fkey" FOREIGN KEY ("monitorCheckId") REFERENCES "MonitorCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
