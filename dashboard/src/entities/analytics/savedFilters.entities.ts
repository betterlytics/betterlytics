import { z } from 'zod';
import { FILTER_COLUMNS, FILTER_OPERATORS } from './filter.entities';

export const SavedFilterEntrySchema = z.object({
  id: z.string(),
  column: z.enum(FILTER_COLUMNS),
  operator: z.enum(FILTER_OPERATORS),
  values: z.string().min(1).array().min(1),
});

export const SavedFilterSchema = z.object({
  id: z.string().cuid(),
  name: z.string().min(1).max(64),
  entries: z.array(SavedFilterEntrySchema),
  dashboardId: z.string().cuid(),
});

export const CreateSavedFilterSchema = z.object({
  name: z.string().min(1, 'Name is required').max(64),
  dashboardId: z.string().cuid(),
  entries: z
    .array(SavedFilterEntrySchema.omit({ id: true }).extend({ values: z.string().min(1).array().min(1) }))
    .min(1, 'At least one filter is required'),
});

export type SavedFilter = z.infer<typeof SavedFilterSchema>;
export type SavedFilterEntry = z.infer<typeof SavedFilterEntrySchema>;
export type CreateSavedFilter = z.infer<typeof CreateSavedFilterSchema>;
