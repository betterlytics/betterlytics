-- CreateTable
CREATE TABLE "FunnelStep" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "column" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "funnelId" TEXT NOT NULL,

    CONSTRAINT "FunnelStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FunnelStep_funnelId_idx" ON "FunnelStep"("funnelId");

-- AddForeignKey
ALTER TABLE "FunnelStep" ADD CONSTRAINT "FunnelStep_funnelId_fkey" FOREIGN KEY ("funnelId") REFERENCES "Funnel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Insert FunnelSteps from queryFilters
INSERT INTO "FunnelStep" ("id", "name", "column", "operator", "value", "funnelId")
SELECT
    gen_random_uuid() AS id,
    'unnamed' AS name,
    elem->>'column' AS column,
    elem->>'operator' AS operator,
    elem->>'value' AS value,
    f."id" AS funnelId
FROM "Funnel" f
CROSS JOIN LATERAL json_array_elements(f."queryFilters"::json) AS elem
WHERE json_typeof(f."queryFilters"::json) = 'array';

-- AlterTable
ALTER TABLE "Funnel" ALTER COLUMN "queryFilters" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Funnel" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Funnel" ADD COLUMN     "deletedAt" TIMESTAMP(3);

