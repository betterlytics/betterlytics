-- CreateTable
CREATE TABLE "SavedFilter" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "dashboardId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SavedFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedFilterEntry" (
    "id" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "savedFilterId" TEXT NOT NULL,

    CONSTRAINT "SavedFilterEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedFilter_dashboardId_idx" ON "SavedFilter"("dashboardId");

-- CreateIndex
CREATE INDEX "SavedFilterEntry_savedFilterId_idx" ON "SavedFilterEntry"("savedFilterId");

-- AddForeignKey
ALTER TABLE "SavedFilter" ADD CONSTRAINT "SavedFilter_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedFilterEntry" ADD CONSTRAINT "SavedFilterEntry_savedFilterId_fkey" FOREIGN KEY ("savedFilterId") REFERENCES "SavedFilter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
