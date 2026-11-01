-- Plan identity moves from a fixed enum to a billing-catalog id, so new plans need no migration.
ALTER TABLE "Subscription" RENAME COLUMN "tier" TO "planId";
ALTER TABLE "Subscription" ALTER COLUMN "planId" TYPE TEXT USING "planId"::text;
DROP TYPE "SubscriptionTier";
