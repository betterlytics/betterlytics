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
  error_exceptions: z.string(),
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

export const SessionTrailEventSchema = z.object({
  timestamp: z.date(),
  event_type: z.string(),
  url: z.string(),
  custom_event_name: z.string(),
  outbound_link_url: z.string(),
  error_type: z.string(),
  error_message: z.string(),
  error_fingerprint: z.string(),
});

export type ErrorGroupRow = z.infer<typeof ErrorGroupRowSchema>;
export type ErrorGroupVolumeRow = z.infer<typeof ErrorGroupVolumeRowSchema>;
export type ErrorGroupEnvironmentRow = z.infer<typeof ErrorGroupEnvironmentRowSchema>;
export type ErrorGroupVolumePoint = z.infer<typeof ErrorGroupVolumePointSchema>;
export type RawErrorOccurrenceRow = z.infer<typeof RawErrorOccurrenceRowSchema>;
export type StackFrame = z.infer<typeof StackFrameSchema>;
export type ErrorOccurrence = z.infer<typeof ErrorOccurrenceSchema>;
export type SessionTrailEvent = z.infer<typeof SessionTrailEventSchema>;

export type GroupedSessionTrailEvent = {
  event: SessionTrailEvent;
  label: string;
  count: number;
};
