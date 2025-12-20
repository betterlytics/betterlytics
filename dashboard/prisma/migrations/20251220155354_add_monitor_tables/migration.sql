-- CreateEnum
CREATE TYPE "MonitorAlertType" AS ENUM ('down', 'recovery', 'ssl_expiring', 'ssl_expired');

-- CreateTable
CREATE TABLE "MonitorCheck" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "intervalSeconds" INTEGER NOT NULL DEFAULT 30,
    "timeoutMs" INTEGER NOT NULL DEFAULT 3000,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "checkSslErrors" BOOLEAN NOT NULL DEFAULT true,
    "sslExpiryReminders" BOOLEAN NOT NULL DEFAULT true,
    "httpMethod" TEXT NOT NULL DEFAULT 'HEAD',
    "requestHeaders" JSONB,
    "acceptedStatusCodes" JSONB NOT NULL DEFAULT '["2xx"]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "alertEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "alertOnDown" BOOLEAN NOT NULL DEFAULT true,
    "alertOnRecovery" BOOLEAN NOT NULL DEFAULT true,
    "alertOnSslExpiry" BOOLEAN NOT NULL DEFAULT true,
    "sslExpiryAlertDays" INTEGER NOT NULL DEFAULT 14,
    "failureThreshold" INTEGER NOT NULL DEFAULT 3,

    CONSTRAINT "MonitorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonitorAlertHistory" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "monitorCheckId" TEXT NOT NULL,
    "alertType" "MonitorAlertType" NOT NULL,
    "sentTo" TEXT[],
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statusCode" INTEGER,
    "latencyMs" INTEGER,
    "sslDaysLeft" INTEGER,

    CONSTRAINT "MonitorAlertHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorCheck_dashboardId_idx" ON "MonitorCheck"("dashboardId");

-- CreateIndex
CREATE INDEX "MonitorAlertHistory_monitorCheckId_idx" ON "MonitorAlertHistory"("monitorCheckId");

-- CreateIndex
CREATE INDEX "MonitorAlertHistory_sentAt_idx" ON "MonitorAlertHistory"("sentAt");

-- AddForeignKey
ALTER TABLE "MonitorCheck" ADD CONSTRAINT "MonitorCheck_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonitorAlertHistory" ADD CONSTRAINT "MonitorAlertHistory_monitorCheckId_fkey" FOREIGN KEY ("monitorCheckId") REFERENCES "MonitorCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
