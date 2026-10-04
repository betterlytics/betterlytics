-- AlterTable
ALTER TABLE "FunnelStep" ADD COLUMN     "position" INTEGER NOT NULL DEFAULT 0;

-- MigrateData: the step order was never stored, so recover the best signal still available.
-- Prisma mints one cuid per step in write order and cuid v1 sorts lexicographically by
-- creation time, so the primary key recovers the authored order for every step the
-- application has written. Some steps backfilled by 20251130102124 got gen_random_uuid()
-- instead, which carries no order at all; nothing has rewritten those rows since, so their
-- physical position is still the order that migration inserted them in.
UPDATE "FunnelStep" AS "step"
SET "position" = "ordered"."position"
FROM (
    SELECT
        "id",
        (ROW_NUMBER() OVER (
            PARTITION BY "funnelId"
            ORDER BY CASE WHEN "id" LIKE '%-%' THEN NULL ELSE "id" END NULLS LAST, "ctid"
        ) - 1)::INTEGER AS "position"
    FROM "FunnelStep"
) AS "ordered"
WHERE "step"."id" = "ordered"."id";
