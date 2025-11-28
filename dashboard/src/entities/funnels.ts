import { z } from 'zod';
import { QueryFilterSchema } from './filter';

export const FunnelStepSchema = QueryFilterSchema.extend({
  name: z.string(),
});

export const FunnelSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  funnelSteps: z.array(FunnelStepSchema),
  dashboardId: z.string().cuid(),
  isStrict: z.boolean(),
});

export const FunnelDetailsSchema = FunnelSchema.extend({
  visitors: z.number().array(),
});

export const FunnelPreviewSchema = z.object({
  funnelSteps: z.array(FunnelStepSchema),
  visitors: z.number().array(),
});

export const CreateFunnelSchema = z.object({
  name: z.string().min(1, 'Funnel name is required'),
  dashboardId: z.string().cuid('Valid Dashboard ID is required'),
  isStrict: z.boolean(),
  funnelSteps: z.array(FunnelStepSchema.omit({ id: true })).min(2),
});

export const UpdateFunnelSchema = CreateFunnelSchema.extend({
  id: z.string().cuid('Valid Funnel ID is required'),
});

export type Funnel = z.infer<typeof FunnelSchema>;
export type FunnelStep = z.infer<typeof FunnelStepSchema>;
export type FunnelDetails = z.infer<typeof FunnelDetailsSchema>;
export type FunnelPreview = z.infer<typeof FunnelPreviewSchema>;
export type CreateFunnel = z.infer<typeof CreateFunnelSchema>;
export type UpdateFunnel = z.infer<typeof UpdateFunnelSchema>;
