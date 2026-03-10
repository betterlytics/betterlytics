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

export const RawErrorOccurrenceRowSchema = z.object({
  timestamp: z.date(),
  url: z.string(),
  browser: z.string(),
  os: z.string(),
  device_type: z.string(),
  country_code: z.string(),
  session_id: z.string(),
  error_type: z.string(),
  error_message: z.string(),
  exception_list: z.string(),
});

export const StackFrameSchema = z.object({
  fn: z.string(),
  file: z.string(),
  line: z.number().int().nullable(),
  col: z.number().int().nullable(),
  inApp: z.boolean(),
});

export const ErrorOccurrenceSchema = z.object({
  timestamp: z.date(),
  url: z.string(),
  browser: z.string(),
  os: z.string(),
  device_type: z.string(),
  country_code: z.string(),
  session_id: z.string(),
  error_type: z.string(),
  error_message: z.string(),
  mechanism: z.string(),
  frames: z.array(StackFrameSchema),
});

export type ErrorGroupRow = z.infer<typeof ErrorGroupRowSchema>;
export type ErrorVolumeRow = z.infer<typeof ErrorVolumeRowSchema>;
export type ErrorGroupVolumeRow = z.infer<typeof ErrorGroupVolumeRowSchema>;
export type ErrorGroupEnvironmentRow = z.infer<typeof ErrorGroupEnvironmentRowSchema>;
export type ErrorGroupVolumePoint = z.infer<typeof ErrorGroupVolumePointSchema>;
export type RawErrorOccurrenceRow = z.infer<typeof RawErrorOccurrenceRowSchema>;
export type StackFrame = z.infer<typeof StackFrameSchema>;
export type ErrorOccurrence = z.infer<typeof ErrorOccurrenceSchema>;
