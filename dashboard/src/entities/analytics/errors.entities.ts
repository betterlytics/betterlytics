import { z } from 'zod';

export const ErrorGroupRowSchema = z.object({
  error_fingerprint: z.string(),
  error_type: z.string(),
  error_message: z.string(),
  count: z.number().int().min(0),
  last_seen: z.date(),
  mechanism: z.string(),
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

export type ErrorGroupRow = z.infer<typeof ErrorGroupRowSchema>;
export type ErrorVolumeRow = z.infer<typeof ErrorVolumeRowSchema>;
export type ErrorGroupVolumeRow = z.infer<typeof ErrorGroupVolumeRowSchema>;
