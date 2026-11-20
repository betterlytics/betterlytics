-- CreateTable
CREATE TABLE "HeatmapCaptureLink" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "HeatmapCaptureLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HeatmapCapture" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "device" TEXT NOT NULL,
    "viewportWidth" INTEGER NOT NULL,
    "documentHeight" INTEGER NOT NULL,
    "storage" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "createdById" TEXT,
    "capturedFromUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HeatmapCapture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HeatmapCaptureLink_tokenHash_key" ON "HeatmapCaptureLink"("tokenHash");

-- CreateIndex
CREATE INDEX "HeatmapCaptureLink_dashboardId_createdById_idx" ON "HeatmapCaptureLink"("dashboardId", "createdById");

-- CreateIndex
CREATE INDEX "HeatmapCaptureLink_expiresAt_idx" ON "HeatmapCaptureLink"("expiresAt");

-- CreateIndex
CREATE INDEX "HeatmapCapture_dashboardId_path_device_createdAt_idx" ON "HeatmapCapture"("dashboardId", "path", "device", "createdAt");

-- AddForeignKey
ALTER TABLE "HeatmapCaptureLink" ADD CONSTRAINT "HeatmapCaptureLink_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatmapCaptureLink" ADD CONSTRAINT "HeatmapCaptureLink_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatmapCapture" ADD CONSTRAINT "HeatmapCapture_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HeatmapCapture" ADD CONSTRAINT "HeatmapCapture_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
