import { z } from 'zod';

export const ErrorGroupStatusValueSchema = z.enum(['unresolved', 'resolved', 'ignored']);
export type ErrorGroupStatusValue = z.infer<typeof ErrorGroupStatusValueSchema>;

export const ErrorGroupRowSchema = z.object({
  error_fingerprint: z.string(),
  error_type: z.string(),
  error_message: z.string(),
  count: z.number().int().min(0),
  first_seen: z.date().optional(),
  last_seen: z.date().optional(),
  session_count: z.number().int().min(0),
  status: ErrorGroupStatusValueSchema.default('unresolved'),
});

export const ErrorGroupVolumeRowSchema = z.object({
  error_fingerprint: z.string(),
  date: z.string(),
  error_count: z.number().int().min(0),
});

export type ErrorGroupRow = z.infer<typeof ErrorGroupRowSchema>;
export type ErrorGroupVolumeRow = z.infer<typeof ErrorGroupVolumeRowSchema>;
