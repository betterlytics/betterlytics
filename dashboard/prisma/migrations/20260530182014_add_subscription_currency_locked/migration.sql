-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "currencyLocked" BOOLEAN NOT NULL DEFAULT false;

-- Backfill: existing customers who have a Stripe customer are treated as currency-locked, since
-- Stripe sets (and permanently locks) customer.currency on first payment. New free users without a
-- Stripe customer stay unlocked and can still choose their currency.
UPDATE "Subscription" SET "currencyLocked" = true WHERE "paymentCustomerId" IS NOT NULL;
