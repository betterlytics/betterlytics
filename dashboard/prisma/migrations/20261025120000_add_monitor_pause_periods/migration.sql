-- CreateTable
CREATE TABLE "MonitorPausePeriod" (
    "id" TEXT NOT NULL,
    "monitorCheckId" TEXT NOT NULL,
    "pausedAt" TIMESTAMP(3) NOT NULL,
    "resumedAt" TIMESTAMP(3),

    CONSTRAINT "MonitorPausePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorPausePeriod_monitorCheckId_pausedAt_idx" ON "MonitorPausePeriod"("monitorCheckId", "pausedAt");

-- AddForeignKey
ALTER TABLE "MonitorPausePeriod" ADD CONSTRAINT "MonitorPausePeriod_monitorCheckId_fkey" FOREIGN KEY ("monitorCheckId") REFERENCES "MonitorCheck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
