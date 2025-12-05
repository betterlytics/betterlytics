import { parseClickHouseDate } from '@/utils/dateHelpers';
import { z } from 'zod';

export const SessionReplaySchema = z.object({
  site_id: z.string(),
  session_id: z.string(),
  visitor_id: z.string(),
  started_at: z.string().transform((val) => parseClickHouseDate(val)),
  ended_at: z.string().transform((val) => parseClickHouseDate(val)),
  duration: z.number(),
  date: z.string(),
  size_bytes: z.number(),
  event_count: z.number(),
  s3_prefix: z.string(),
  start_url: z.string(),
  device_type: z.string().optional().default(''),
  browser: z.string().optional().default(''),
  os: z.string().optional().default(''),
  country_code: z.string().optional().nullable(),
});

export const SessionReplayArraySchema = SessionReplaySchema.array();

export type SessionReplay = z.infer<typeof SessionReplaySchema>;

export const ReplaySegmentManifestEntrySchema = z.object({
  key: z.string(),
  url: z.string(),
  sizeBytes: z.number(),
  lastModified: z.string().optional(),
});

export const ReplaySegmentManifestSchema = ReplaySegmentManifestEntrySchema.array();

export type ReplaySegmentManifestEntry = z.infer<typeof ReplaySegmentManifestEntrySchema>;
export type ReplaySegmentManifest = z.infer<typeof ReplaySegmentManifestSchema>;
