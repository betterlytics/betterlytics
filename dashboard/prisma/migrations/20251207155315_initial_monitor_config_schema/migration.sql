-- CreateTable
CREATE TABLE "MonitorCheck" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "name" TEXT,
    "url" TEXT NOT NULL,
    "intervalSeconds" INTEGER NOT NULL DEFAULT 30,
    "timeoutMs" INTEGER NOT NULL DEFAULT 3000,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MonitorCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MonitorCheck_dashboardId_idx" ON "MonitorCheck"("dashboardId");

-- AddForeignKey
ALTER TABLE "MonitorCheck" ADD CONSTRAINT "MonitorCheck_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;
