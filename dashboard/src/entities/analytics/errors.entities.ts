import { z } from 'zod';

export const ErrorGroupStatusValueSchema = z.enum(['unresolved', 'resolved', 'ignored']);
export type ErrorGroupStatusValue = z.infer<typeof ErrorGroupStatusValueSchema>;

export const ErrorGroupRowSchema = z.object({
  error_fingerprint: z.string(),
  error_type: z.string(),
  error_message: z.string(),
  count: z.number().int().min(0),
  first_seen: z.date().optional(),
  last_seen: z.date(),
  session_count: z.number().int().min(0),
  status: ErrorGroupStatusValueSchema.default('unresolved'),
});

export const ErrorVolumeRowSchema = z.object({
  date: z.string(),
  errorCount: z.number().int().min(0),
});

export const ErrorGroupVolumeRowSchema = z.object({
  error_fingerprint: z.string(),
  date: z.string(),
  errorCount: z.number().int().min(0),
});

export const ErrorGroupEnvironmentRowSchema = z.object({
  label: z.string(),
  count: z.number().int().min(0),
});

export const ErrorGroupVolumePointSchema = z.object({
  date: z.string(),
  count: z.number().int().min(0),
});

export type ErrorGroupRow = z.infer<typeof ErrorGroupRowSchema>;
export type ErrorVolumeRow = z.infer<typeof ErrorVolumeRowSchema>;
export type ErrorGroupVolumeRow = z.infer<typeof ErrorGroupVolumeRowSchema>;
export type ErrorGroupEnvironmentRow = z.infer<typeof ErrorGroupEnvironmentRowSchema>;
export type ErrorGroupVolumePoint = z.infer<typeof ErrorGroupVolumePointSchema>;
