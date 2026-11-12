-- Pro becomes Business and paid Growth becomes Plus, both on their current Stripe price. Free Growth accounts stay on the grandfathered growth plan.
UPDATE "Subscription" SET "planId" = 'business' WHERE "planId" = 'professional';
UPDATE "Subscription" SET "planId" = 'plus' WHERE "planId" = 'growth' AND "pricePerMonth" > 0;
