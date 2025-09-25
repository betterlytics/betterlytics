import { z } from 'zod';

export const SessionReplaySchema = z.object({
  site_id: z.string(),
  session_id: z.string(),
  visitor_id: z.string(),
  started_at: z.string(),
  ended_at: z.string(),
  duration: z.number(),
  date: z.string(),
  size_bytes: z.number(),
  s3_prefix: z.string(),
  sample_rate: z.number(),
  start_url: z.string(),
});

export const SessionReplayArraySchema = SessionReplaySchema.array();

export type SessionReplay = z.infer<typeof SessionReplaySchema>;
