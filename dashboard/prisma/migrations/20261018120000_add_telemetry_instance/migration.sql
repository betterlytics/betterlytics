-- CreateTable
CREATE TABLE "TelemetryInstance" (
    "id" TEXT NOT NULL DEFAULT 'instance',
    "instanceId" UUID NOT NULL,
    "lastSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TelemetryInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TelemetryInstance_instanceId_key" ON "TelemetryInstance"("instanceId");
