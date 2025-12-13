import { z } from 'zod';
import { SubscriptionTier as PrismaSubscriptionTier, Currency as PrismaCurrency } from '@prisma/client';
import { addMonths, startOfDay } from 'date-fns';

export const TierSchema = z.nativeEnum(PrismaSubscriptionTier);
export const CurrencySchema = z.nativeEnum(PrismaCurrency).default('USD');
export const PaymentStatusSchema = z.enum(['paid', 'pending', 'failed', 'refunded', 'past-due']);

export const STARTER_SUBSCRIPTION_STATIC = {
  tier: PrismaSubscriptionTier.growth,
  eventLimit: 10_000,
  pricePerMonth: 0,
  currency: PrismaCurrency.USD,
  status: 'active' as const,
  cancelAtPeriodEnd: false,
};

export function buildStarterSubscription() {
  const currentPeriodStart = startOfDay(new Date());
  const currentPeriodEnd = addMonths(currentPeriodStart, 1);
  return {
    ...STARTER_SUBSCRIPTION_STATIC,
    currentPeriodStart,
    currentPeriodEnd,
  };
}

export const SubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: TierSchema,
  eventLimit: z.number(),
  pricePerMonth: z.number(),
  currency: CurrencySchema,
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  quotaExceededDate: z.date().nullable(),
  status: z.string(),
  cancelAtPeriodEnd: z.boolean(),
  paymentCustomerId: z.string().nullable(),
  paymentSubscriptionId: z.string().nullable(),
  paymentPriceId: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UpsertSubscriptionSchema = z.object({
  userId: z.string(),
  tier: TierSchema,
  status: z.string(),
  eventLimit: z.number(),
  pricePerMonth: z.number(),
  currency: CurrencySchema,
  cancelAtPeriodEnd: z.boolean().default(false),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  paymentCustomerId: z.string().optional(),
  paymentSubscriptionId: z.string().optional(),
  paymentPriceId: z.string().optional(),
});

export const UsageDataSchema = z.object({
  current: z.number(),
  limit: z.number(),
  remaining: z.number(),
  isOverLimit: z.boolean(),
  usagePercentage: z.number(),
  daysUntilReset: z.number(),
  billingPeriod: z.object({
    start: z.date(),
    end: z.date(),
  }),
});

export const EventCountResultSchema = z.object({
  total: z.number(),
});

export const UserBillingDataSchema = z.object({
  subscription: z.object({
    tier: TierSchema,
    eventLimit: z.number(),
    pricePerMonth: z.number(),
    currency: CurrencySchema,
    currentPeriodEnd: z.date(),
    status: z.string(),
    cancelAtPeriodEnd: z.boolean(),
  }),
  usage: UsageDataSchema,
  isExistingPaidSubscriber: z.boolean(),
  isFreePlanUser: z.boolean(),
});

export type Currency = z.infer<typeof CurrencySchema>;
export type Tier = z.infer<typeof TierSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type UpsertSubscriptionData = z.infer<typeof UpsertSubscriptionSchema>;
export type UsageData = z.infer<typeof UsageDataSchema>;
export type EventCountResult = z.infer<typeof EventCountResultSchema>;
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;
export type UserBillingData = z.infer<typeof UserBillingDataSchema>;
