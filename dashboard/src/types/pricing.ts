import { z } from 'zod';
import { CurrencySchema, PlanIdSchema } from '@/entities/billing/billing.entities';

/** Prices and Stripe keys are resolved from the catalog on the server, never taken from here. */
export const SelectedPlanSchema = z.object({
  planId: PlanIdSchema,
  eventLimit: z.number().int().positive(),
  currency: CurrencySchema,
});

export type SelectedPlan = z.infer<typeof SelectedPlanSchema>;
