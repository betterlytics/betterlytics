import { z } from 'zod';
import { isNonEmptyValue, QueryFilterSchema } from './filter.entities';

export const FunnelStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  filters: z.array(QueryFilterSchema),
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
  isStrict: z.boolean(),
});

const CreateFunnelFilterSchema = QueryFilterSchema.omit({ id: true });

export const CreateFunnelSchema = z.object({
  name: z.string().min(1, 'Funnel name is required'),
  dashboardId: z.string().cuid('Valid Dashboard ID is required'),
  isStrict: z.boolean(),
  funnelSteps: z
    .array(
      z.object({
        name: z.string().min(1, 'Name is required'),
        filters: z
          .array(CreateFunnelFilterSchema)
          .transform((filters) =>
            filters
              .map((filter) => ({ ...filter, values: filter.values.filter(isNonEmptyValue) }))
              .filter((filter) => filter.values.length > 0),
          )
          .pipe(z.array(CreateFunnelFilterSchema).min(1, 'At least one filter with a value is required')),
      }),
    )
    .min(2),
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
