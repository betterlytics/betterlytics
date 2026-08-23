-- AlterTable
ALTER TABLE "FunnelStep" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- MigrateData: the step order was never stored, so recover the best signal still available.
-- Prisma mints one cuid per step in the order the steps are written, and cuids sort
-- lexicographically by creation time, so ordering by the primary key restores the authored
-- order for the funnels the application has written.
UPDATE "FunnelStep" AS "step"
SET "position" = "ordered"."position"
FROM (
    SELECT "id", (ROW_NUMBER() OVER (PARTITION BY "funnelId" ORDER BY "id") - 1)::INTEGER AS "position"
    FROM "FunnelStep"
) AS "ordered"
WHERE "step"."id" = "ordered"."id";
