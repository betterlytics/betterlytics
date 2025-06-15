import { z } from 'zod';

export const TierSchema = z.enum(['growth', 'professional', 'enterprise']);
export type Tier = z.infer<typeof TierSchema>;

export const SelectedPlanSchema = z.object({
  tier: TierSchema,
  eventLimit: z.number(),
  price: z.number(), // Cents
  period: z.string(),
});

export type SelectedPlan = z.infer<typeof SelectedPlanSchema>;
