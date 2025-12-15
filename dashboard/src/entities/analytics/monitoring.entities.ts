import { z } from 'zod';

export const MonitorStatusSchema = z.enum(['ok', 'warn', 'down', 'error']);
export type MonitorStatus = z.infer<typeof MonitorStatusSchema>;

export const MonitorCheckSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  name: z.string().nullable().optional(),
  url: z.string().url(),
  intervalSeconds: z.number().int().min(5),
  timeoutMs: z.number().int().min(500),
  isEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MonitorCheckCreateSchema = z.object({
  dashboardId: z.string(),
  name: z.string().trim().max(120).optional().nullable(),
  url: z.string().url(),
  intervalSeconds: z.number().int().min(5).max(3600).default(30),
  timeoutMs: z.number().int().min(500).max(120_000).default(3000),
  isEnabled: z.boolean().default(true),
});

export const MonitorCheckUpdateSchema = MonitorCheckCreateSchema.extend({
  id: z.string(),
}).required({
  id: true,
  dashboardId: true,
  url: true,
  intervalSeconds: true,
  timeoutMs: true,
  isEnabled: true,
});

export type MonitorCheck = z.infer<typeof MonitorCheckSchema>;
export type MonitorCheckCreate = z.infer<typeof MonitorCheckCreateSchema>;
export type MonitorCheckUpdate = z.infer<typeof MonitorCheckUpdateSchema>;

export const MonitorUptimeBucketSchema = z.object({
  bucket: z.string(), // ISO timestamp string
  upRatio: z.number().min(0).max(1).nullable(),
});

export type MonitorUptimeBucket = z.infer<typeof MonitorUptimeBucketSchema>;

export const MonitorLatencyStatsSchema = z.object({
  avgMs: z.number().nullable(),
  minMs: z.number().nullable(),
  maxMs: z.number().nullable(),
});

export const MonitorLatencyPointSchema = z.object({
  bucket: z.string(),
  p50Ms: z.number().nullable(),
  p95Ms: z.number().nullable(),
  avgMs: z.number().nullable(),
});

export const MonitorMetricsSchema = z.object({
  lastCheckAt: z.string().nullable(),
  lastStatus: MonitorStatusSchema.nullable(),
  uptime24hPercent: z.number().nullable(),
  incidents24h: z.number().int(),
  uptimeBuckets: z.array(MonitorUptimeBucketSchema),
  latency: MonitorLatencyStatsSchema,
  latencySeries: z.array(MonitorLatencyPointSchema),
  effectiveIntervalSeconds: z.number().int().nullable().optional(),
  backoffLevel: z.number().int().nullable().optional(),
});

export type MonitorMetrics = z.infer<typeof MonitorMetricsSchema>;

export const MonitorResultSchema = z.object({
  ts: z.string(),
  status: MonitorStatusSchema,
  latencyMs: z.number().nullable(),
  statusCode: z.number().int().nullable(),
  reasonCode: z.string().nullable(),
});

export type MonitorResult = z.infer<typeof MonitorResultSchema>;

export const MonitorTlsResultSchema = z.object({
  ts: z.string(),
  status: MonitorStatusSchema,
  reasonCode: z.string().nullable(),
  tlsNotAfter: z.string().nullable(),
  tlsDaysLeft: z.number().int().nullable(),
});

export type MonitorTlsResult = z.infer<typeof MonitorTlsResultSchema>;

export const MonitorIncidentSchema = z.object({
  ts: z.string(),
  status: MonitorStatusSchema,
  latencyMs: z.number().nullable(),
  statusCode: z.number().int().nullable(),
  reasonCode: z.string().nullable(),
});

export type MonitorIncident = z.infer<typeof MonitorIncidentSchema>;

export const MonitorIncidentSegmentSchema = z.object({
  status: MonitorStatusSchema,
  reason: z.string().nullable(),
  start: z.string(),
  end: z.string().nullable(),
  durationMs: z.number().nullable(),
});

export type MonitorIncidentSegment = z.infer<typeof MonitorIncidentSegmentSchema>;

export const MonitorDailyUptimeSchema = z.object({
  date: z.string(), // ISO date string at start of day UTC
  upRatio: z.number().min(0).max(1).nullable(),
});

export type MonitorDailyUptime = z.infer<typeof MonitorDailyUptimeSchema>;
