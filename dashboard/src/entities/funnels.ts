import { z } from 'zod';
import { QueryFilterSchema } from './filter';

export const FunnelSchema = z.object({
  id: z.string().cuid(),
  name: z.string(),
  queryFilters: z.array(QueryFilterSchema),
  dashboardId: z.string().cuid(),
  isStrict: z.boolean(),
});

export const FunnelDetailsSchema = FunnelSchema.extend({
  visitors: z.number().array(),
});

export const FunnelPreviewSchema = z.object({
  queryFilters: z.array(QueryFilterSchema),
  visitors: z.number().array(),
});

export const CreateFunnelSchema = z.object({
  name: z.string().min(1, 'Funnel name is required'),
  dashboardId: z.string().cuid('Valid Dashboard ID is required'),
  isStrict: z.boolean(),
  queryFilters: z.array(QueryFilterSchema).min(2),
});

export type Funnel = z.infer<typeof FunnelSchema>;
export type FunnelDetails = z.infer<typeof FunnelDetailsSchema>;
export type FunnelPreview = z.infer<typeof FunnelPreviewSchema>;
export type CreateFunnel = z.infer<typeof CreateFunnelSchema>;
