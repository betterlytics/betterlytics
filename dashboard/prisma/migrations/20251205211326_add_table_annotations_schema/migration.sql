-- CreateTable
CREATE TABLE "Annotation" (
    "id" TEXT NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "chartId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "label" VARCHAR(48) NOT NULL,
    "description" VARCHAR(256),
    "color" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Annotation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Annotation_dashboardId_chartId_idx" ON "Annotation"("dashboardId", "chartId");

-- CreateIndex
CREATE INDEX "Annotation_dashboardId_date_idx" ON "Annotation"("dashboardId", "date");

-- CreateIndex
CREATE INDEX "Annotation_createdById_idx" ON "Annotation"("createdById");

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Annotation" ADD CONSTRAINT "Annotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
