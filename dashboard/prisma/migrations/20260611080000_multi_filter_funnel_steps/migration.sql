-- CreateTable
CREATE TABLE "FunnelStepFilter" (
    "id" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "values" TEXT[],
    "funnelStepId" TEXT NOT NULL,

    CONSTRAINT "FunnelStepFilter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunnelStepFilter_funnelStepId_idx" ON "FunnelStepFilter"("funnelStepId");

-- AddForeignKey
ALTER TABLE "FunnelStepFilter" ADD CONSTRAINT "FunnelStepFilter_funnelStepId_fkey" FOREIGN KEY ("funnelStepId") REFERENCES "FunnelStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- MigrateData: copy existing single-filter steps into the new table
INSERT INTO "FunnelStepFilter" ("id", "column", "operator", "values", "funnelStepId")
SELECT gen_random_uuid(), "column", "operator", "values", "id"
FROM "FunnelStep";

-- AlterTable: drop old columns after data is migrated
ALTER TABLE "FunnelStep" DROP COLUMN "column",
DROP COLUMN "operator",
DROP COLUMN "values";
