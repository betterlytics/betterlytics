import { z } from 'zod';
import { CurrencySchema } from '@/entities/billing/billing.entities';
import { PlanIdSchema } from '@/lib/billing/catalog';

/** A plan and volume picked in the UI. Prices and Stripe keys are always resolved from the catalog on the server. */
export const SelectedPlanSchema = z.object({
  planId: PlanIdSchema,
  eventLimit: z.number().int().positive(),
  currency: CurrencySchema,
});

export type SelectedPlan = z.infer<typeof SelectedPlanSchema>;
