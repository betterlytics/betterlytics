-- Pro becomes Business and paid Growth becomes Plus, both on their current Stripe price. Free Growth accounts stay on the grandfathered growth plan.
UPDATE "Subscription" SET "planId" = 'business' WHERE "planId" = 'professional';
UPDATE "Subscription" SET "planId" = 'plus' WHERE "planId" = 'growth' AND "pricePerMonth" > 0;

-- Accounts that never got a subscription row would otherwise be created on the new Free plan at their next visit
INSERT INTO "Subscription" ("id", "userId", "planId", "eventLimit", "pricePerMonth", "currency", "currentPeriodStart", "currentPeriodEnd", "status", "cancelAtPeriodEnd", "updatedAt")
SELECT gen_random_uuid()::text, u."id", 'growth', 10000, 0, 'USD', now(), now() + interval '1 month', 'active', false, now()
FROM "User" u
WHERE u."deletedAt" IS NULL
  AND NOT EXISTS (SELECT 1 FROM "Subscription" s WHERE s."userId" = u."id");
