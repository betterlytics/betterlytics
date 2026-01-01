import { z } from 'zod';

export const MonitorStatusSchema = z.enum(['ok', 'warn', 'failed']);
export const IncidentStateSchema = z.enum(['ongoing', 'resolved']);

/**
 * Operational state represents the current state of a monitor from a user's perspective.
 * This is a derived/computed field based on isEnabled, lastStatus, and whether data exists.
 *
 * - `paused`: Monitor is disabled by user
 * - `preparing`: Monitor is enabled but no checks have run yet (waiting for first probe)
 * - `up`: Monitor is healthy (lastStatus === 'ok')
 * - `degraded`: Monitor is experiencing issues but not down (lastStatus === 'warn')
 * - `down`: Monitor is down or errored (lastStatus === 'down' or 'error')
 */
export const MonitorOperationalStateSchema = z.enum(['paused', 'preparing', 'up', 'degraded', 'down']);

export const HttpMethodSchema = z.enum(['HEAD', 'GET']);

export const MONITOR_LIMITS = {
  NAME_MAX: 30,
  URL_MAX: 256,
  REQUEST_HEADERS_MAX: 10,
  REQUEST_HEADER_KEY_MAX: 128,
  REQUEST_HEADER_VALUE_MAX: 2048,
  ALERT_EMAILS_MAX: 5,
  ACCEPTED_STATUS_CODES_MAX: 5,
} as const;

export const RequestHeaderSchema = z.object({
  key: z.string().min(1).max(MONITOR_LIMITS.REQUEST_HEADER_KEY_MAX),
  value: z.string().max(MONITOR_LIMITS.REQUEST_HEADER_VALUE_MAX),
});

export const StatusCodeValueSchema = z.union([
  z.number().int().min(100).max(599),
  z.string().regex(/^[2-5]xx$/, 'Must be a valid range like 2xx, 3xx, 4xx, or 5xx'),
]);

export const MonitorCheckBaseSchema = z.object({
  name: z.string().trim().max(MONITOR_LIMITS.NAME_MAX).optional().nullable(),
  intervalSeconds: z.number().int().min(60).max(3600).default(300),
  timeoutMs: z.number().int().min(500).max(120_000).default(3000),
  isEnabled: z.boolean().default(true),
  checkSslErrors: z.boolean().default(true),
  sslExpiryReminders: z.boolean().default(true),
  httpMethod: HttpMethodSchema.default('HEAD'),
  requestHeaders: z.array(RequestHeaderSchema).max(MONITOR_LIMITS.REQUEST_HEADERS_MAX).optional().nullable(),
  acceptedStatusCodes: z
    .array(StatusCodeValueSchema)
    .max(MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX)
    .default(['2xx']),
  alertsEnabled: z.boolean().default(true),
  alertEmails: z.array(z.string().email()).max(MONITOR_LIMITS.ALERT_EMAILS_MAX).default([]),
  alertOnDown: z.boolean().default(true),
  alertOnRecovery: z.boolean().default(true),
  alertOnSslExpiry: z.boolean().default(true),
  sslExpiryAlertDays: z.number().int().min(1).max(90).default(14),
  failureThreshold: z.number().int().min(1).max(10).default(3),
});

export const MONITOR_DEFAULTS = MonitorCheckBaseSchema.parse({}) as {
  intervalSeconds: number;
  timeoutMs: number;
  failureThreshold: number;
  sslExpiryAlertDays: number;
};

export const MonitorCheckCreateSchema = MonitorCheckBaseSchema.extend({
  url: z
    .string()
    .url()
    .max(MONITOR_LIMITS.URL_MAX)
    .refine((url) => url.startsWith('https://') || url.startsWith('http://'), {
      message: 'URL must start with https:// or http://',
    }),
});

export const MonitorCheckSchema = MonitorCheckBaseSchema.extend({
  id: z.string(),
  dashboardId: z.string(),
  url: z.string().url(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const MonitorCheckUpdateSchema = MonitorCheckCreateSchema.omit({ url: true, alertEmails: true })
  .partial()
  .extend({
    id: z.string(),
  });

export const MonitorIncidentSegmentSchema = z.object({
  state: IncidentStateSchema,
  reason: z.string().nullable(),
  start: z.string(),
  end: z.string().nullable(),
  durationMs: z.number().nullable(),
});

export const UptimeStatsSchema = z.object({
  uptimeSeconds: z.number(),
  totalSeconds: z.number(),
});

export const MonitorUptimeBucketSchema = z.object({
  bucket: z.string(), // ISO timestamp string
  upRatio: z.number().min(0).max(1).nullable(),
  totalSeconds: z.number().nullable(),
});

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

export const RawMonitorMetricsSchema = z.object({
  lastCheckAt: z.string().nullable(),
  lastStatus: MonitorStatusSchema.nullable(),
  uptime24hPercent: z.number().nullable(),
  uptime24hHours: z.number().nullable(),
  incidents24h: z.number().int(),
  uptimeBuckets: z.array(MonitorUptimeBucketSchema),
  latency: MonitorLatencyStatsSchema,
  latencySeries: z.array(MonitorLatencyPointSchema),
  effectiveIntervalSeconds: z.number().int().nullable().optional(),
  backoffLevel: z.number().int().nullable().optional(),
});

export const MonitorMetricsSchema = RawMonitorMetricsSchema.extend({
  operationalState: MonitorOperationalStateSchema,
  currentStateSince: z.string().nullable(),
  incidentSegments24h: z.array(MonitorIncidentSegmentSchema),
});

export const LatestCheckInfoSchema = z.object({
  ts: z.string().nullable(),
  status: MonitorStatusSchema.nullable(),
  effectiveIntervalSeconds: z.number().int().nullable(),
  backoffLevel: z.number().int().nullable(),
});

export const MonitorResultSchema = z.object({
  ts: z.string(),
  status: MonitorStatusSchema,
  latencyMs: z.number().nullable(),
  statusCode: z.number().int().nullable(),
  reasonCode: z.string().nullable(),
});

export const MonitorTlsResultSchema = z.object({
  ts: z.string(),
  status: MonitorStatusSchema,
  reasonCode: z.string().nullable(),
  tlsNotAfter: z.string().nullable(),
});

export const MonitorDailyUptimeSchema = z.object({
  date: z.string(), // ISO date string at start of day UTC
  upRatio: z.number().min(0).max(1).nullable(),
  totalSeconds: z.number().nullable(),
});

export type MonitorStatus = z.infer<typeof MonitorStatusSchema>;
export type IncidentState = z.infer<typeof IncidentStateSchema>;
export type MonitorOperationalState = z.infer<typeof MonitorOperationalStateSchema>;

export type StatusCodeValue = z.infer<typeof StatusCodeValueSchema>;

export type MonitorCheck = z.infer<typeof MonitorCheckSchema>;
export type MonitorCheckCreate = z.infer<typeof MonitorCheckCreateSchema>;
export type MonitorCheckUpdate = z.infer<typeof MonitorCheckUpdateSchema>;

// This is the primary type used in list views
export type MonitorWithStatus = MonitorCheck & {
  hasOpenIncident: boolean;
  effectiveIntervalSeconds: number | null;
  backoffLevel: number | null;
  uptimeBuckets: MonitorUptimeBucket[];
  tls: MonitorTlsResult | null;
  operationalState: MonitorOperationalState;
  currentStateSince: string | null;
};

export type UptimeStats = z.infer<typeof UptimeStatsSchema>;
export type MonitorUptimeBucket = z.infer<typeof MonitorUptimeBucketSchema>;
export type MonitorLatencyStats = z.infer<typeof MonitorLatencyStatsSchema>;
export type MonitorLatencyPoint = z.infer<typeof MonitorLatencyPointSchema>;
export type RawMonitorMetrics = z.infer<typeof RawMonitorMetricsSchema>;
export type MonitorMetrics = z.infer<typeof MonitorMetricsSchema>;
export type LatestCheckInfo = z.infer<typeof LatestCheckInfoSchema>;

export type MonitorResult = z.infer<typeof MonitorResultSchema>;
export type MonitorTlsResult = z.infer<typeof MonitorTlsResultSchema>;
export type MonitorIncidentSegment = z.infer<typeof MonitorIncidentSegmentSchema>;
export type MonitorDailyUptime = z.infer<typeof MonitorDailyUptimeSchema>;
