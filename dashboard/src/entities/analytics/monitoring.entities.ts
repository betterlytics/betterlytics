import { z } from 'zod';

export const MonitorStatusSchema = z.enum(['ok', 'warn', 'down', 'error']);
export type MonitorStatus = z.infer<typeof MonitorStatusSchema>;

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
export type MonitorOperationalState = z.infer<typeof MonitorOperationalStateSchema>;

export const HttpMethodSchema = z.enum(['HEAD', 'GET']);
export type HttpMethod = z.infer<typeof HttpMethodSchema>;

export const MONITOR_LIMITS = {
  NAME_MAX: 120,
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
export type RequestHeader = z.infer<typeof RequestHeaderSchema>;

// Status code can be a specific number (200, 301) or a range string ('2xx', '3xx')
export const StatusCodeValueSchema = z.union([
  z.number().int().min(100).max(599),
  z.string().regex(/^[2-5]xx$/, 'Must be a valid range like 2xx, 3xx, 4xx, or 5xx'),
]);
export type StatusCodeValue = z.infer<typeof StatusCodeValueSchema>;

export const MonitorCheckSchema = z.object({
  id: z.string(),
  dashboardId: z.string(),
  name: z.string().nullable().optional(),
  url: z.string().url(),
  intervalSeconds: z.number().int().min(5),
  timeoutMs: z.number().int().min(500),
  isEnabled: z.boolean(),
  checkSslErrors: z.boolean(),
  sslExpiryReminders: z.boolean(),
  httpMethod: HttpMethodSchema,
  requestHeaders: z.array(RequestHeaderSchema).nullable(),
  acceptedStatusCodes: z.array(StatusCodeValueSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Alert configuration
  alertsEnabled: z.boolean(),
  alertEmails: z.array(z.string().email()),
  alertOnDown: z.boolean(),
  alertOnRecovery: z.boolean(),
  alertOnSslExpiry: z.boolean(),
  sslExpiryAlertDays: z.number().int().min(1).max(90),
  failureThreshold: z.number().int().min(1).max(10),
});

export const MonitorCheckCreateSchema = z.object({
  dashboardId: z.string(),
  name: z.string().trim().max(MONITOR_LIMITS.NAME_MAX).optional().nullable(),
  url: z.string().url().max(MONITOR_LIMITS.URL_MAX),
  intervalSeconds: z.number().int().min(5).max(3600).default(30),
  timeoutMs: z.number().int().min(500).max(120_000).default(3000),
  isEnabled: z.boolean().default(true),
  checkSslErrors: z.boolean().default(true),
  sslExpiryReminders: z.boolean().default(true),
  httpMethod: HttpMethodSchema.default('HEAD'),
  requestHeaders: z.array(RequestHeaderSchema).max(MONITOR_LIMITS.REQUEST_HEADERS_MAX).nullable().default(null),
  acceptedStatusCodes: z
    .array(StatusCodeValueSchema)
    .max(MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX)
    .default(['2xx']),
  // Alert configuration with defaults
  alertsEnabled: z.boolean().default(true),
  alertEmails: z.array(z.string().email()).max(MONITOR_LIMITS.ALERT_EMAILS_MAX).default([]),
  alertOnDown: z.boolean().default(true),
  alertOnRecovery: z.boolean().default(true),
  alertOnSslExpiry: z.boolean().default(true),
  sslExpiryAlertDays: z.number().int().min(1).max(90).default(14),
  failureThreshold: z.number().int().min(1).max(10).default(3),
});

export const MonitorCheckUpdateSchema = MonitorCheckCreateSchema.omit({ url: true })
  .extend({
    id: z.string(),
  })
  .required({
    id: true,
    dashboardId: true,
    intervalSeconds: true,
    timeoutMs: true,
    isEnabled: true,
    checkSslErrors: true,
    sslExpiryReminders: true,
    httpMethod: true,
    requestHeaders: true,
    acceptedStatusCodes: true,
    alertsEnabled: true,
    alertEmails: true,
    alertOnDown: true,
    alertOnRecovery: true,
    alertOnSslExpiry: true,
    sslExpiryAlertDays: true,
    failureThreshold: true,
  });

export type MonitorCheck = z.infer<typeof MonitorCheckSchema>;
export type MonitorCheckCreate = z.infer<typeof MonitorCheckCreateSchema>;
export type MonitorCheckUpdate = z.infer<typeof MonitorCheckUpdateSchema>;

/**
 * Monitor with computed status fields, as returned by getMonitorChecksWithStatus.
 * This is the primary type used in list views.
 */
export type MonitorWithStatus = MonitorCheck & {
  lastStatus: MonitorStatus | null;
  effectiveIntervalSeconds: number | null;
  backoffLevel: number | null;
  uptimeBuckets: MonitorUptimeBucket[];
  tls: MonitorTlsResult | null;
  operationalState: MonitorOperationalState;
};

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

export const RawMonitorMetricsSchema = z.object({
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

export type RawMonitorMetrics = z.infer<typeof RawMonitorMetricsSchema>;

export const MonitorMetricsSchema = RawMonitorMetricsSchema.extend({
  operationalState: MonitorOperationalStateSchema,
});

export type MonitorMetrics = z.infer<typeof MonitorMetricsSchema>;

export const LatestCheckInfoSchema = z.object({
  ts: z.string().nullable(),
  status: MonitorStatusSchema.nullable(),
  effectiveIntervalSeconds: z.number().int().nullable(),
  backoffLevel: z.number().int().nullable(),
});

export type LatestCheckInfo = z.infer<typeof LatestCheckInfoSchema>;

export const LatestIncidentInfoSchema = z.object({
  state: z.string(),
  severity: z.string(),
  lastStatus: z.string().nullable(),
  startedAt: z.string().nullable(),
  lastEventAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  failureCount: z.number().int().nullable(),
  reasonCode: z.string().nullable(),
});

export type LatestIncidentInfo = z.infer<typeof LatestIncidentInfoSchema>;

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
});

export type MonitorTlsResult = z.infer<typeof MonitorTlsResultSchema>;

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
