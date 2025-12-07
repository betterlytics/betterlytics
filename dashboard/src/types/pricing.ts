import { z } from 'zod';
import { TierSchema, CurrencySchema } from '@/entities/billing/billing.entities';

export const SelectedPlanSchema = z.object({
  tier: TierSchema,
  eventLimit: z.number(),
  price_cents: z.number(),
  period: z.string(),
  currency: CurrencySchema,
  lookup_key: z.string().nullable(),
});

export type SelectedPlan = z.infer<typeof SelectedPlanSchema>;
