import { z } from 'zod';

export const SubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tier: z.string(),
  eventLimit: z.number(),
  pricePerMonth: z.number(),
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

export const BillingHistorySchema = z.object({
  id: z.string(),
  userId: z.string(),
  periodStart: z.date(),
  periodEnd: z.date(),
  eventCount: z.number(),
  eventLimit: z.number(),
  amountPaid: z.number(),
  paymentInvoiceId: z.string().nullable(),
  paymentPaymentIntentId: z.string().nullable(),
  status: z.enum(['paid', 'pending', 'failed', 'refunded']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UserBillingDataSchema = z.object({
  subscription: z.object({
    tier: z.string(),
    eventLimit: z.number(),
    pricePerMonth: z.number(),
    currentPeriodEnd: z.date(),
    status: z.string(),
  }),
  usage: UsageDataSchema,
  isExistingPaidSubscriber: z.boolean(),
  isFreePlanUser: z.boolean(),
});

export type Subscription = z.infer<typeof SubscriptionSchema>;
export type UsageData = z.infer<typeof UsageDataSchema>;
export type EventCountResult = z.infer<typeof EventCountResultSchema>;
export type BillingHistory = z.infer<typeof BillingHistorySchema>;
export type UserBillingData = z.infer<typeof UserBillingDataSchema>;
